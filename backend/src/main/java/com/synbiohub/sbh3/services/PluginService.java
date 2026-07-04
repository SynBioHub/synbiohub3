package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PluginService {

    private final ObjectMapper mapper;

    public ResponseEntity<?> callPlugin(JsonNode requestBody) {
        String name = requestBody.path("name").asText(null);
        String endpoint = requestBody.path("endpoint").asText(null);
        String category = requestBody.path("category").asText(null);

        if (name == null || endpoint == null || category == null) {
            return ResponseEntity.badRequest().body("Missing required plugin call parameters: name, endpoint, category");
        }

        String pluginUrl;
        try {
            pluginUrl = findPluginUrl(name, category);
        } catch (IOException e) {
            log.error("Failed to resolve plugin URL", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to load plugin configuration.");
        }

        if (pluginUrl == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("The plugin " + name + " was not found or there is no url associated with this name. Check that this is a valid plugin name.");
        }

        return switch (endpoint) {
            case "status" -> getStatus(pluginUrl, name);
            case "evaluate" -> getEvaluate(pluginUrl, requestBody.path("data"), category, name);
            case "run" -> getRun(pluginUrl, requestBody.path("data"), category, name, requestBody.path("prefix").asText(null));
            default -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("This plugin endpoint" + endpoint + " is not known. Instead try status, evaluate, or run.");
        };
    }

    private String findPluginUrl(String name, String category) throws IOException {
        JsonNode pluginList = ConfigUtil.get("plugins").get(category);
        if (pluginList == null || !pluginList.isArray()) {
            return null;
        }

        for (JsonNode plugin : pluginList) {
            if (name.equals(plugin.path("name").asText())) {
                return plugin.path("url").asText(null);
            }
        }

        return null;
    }

    private ResponseEntity<String> getStatus(String pluginUrl, String name) {
        try {
            HttpURLConnection connection = openConnection(pluginUrl + "status", "GET", 5000);
            byte[] responseBody = readResponse(connection.getInputStream());
            return ResponseEntity.ok(new String(responseBody, StandardCharsets.UTF_8));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("The plugin " + name + " status endpoint is not responding. Check that the plugin is active and running. " + e);
        }
    }

    private ResponseEntity<?> getEvaluate(String pluginUrl, JsonNode data, String category, String name) {
        try {
            HttpURLConnection connection = openConnection(pluginUrl + "evaluate", "POST", 10000);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accepts", "submit".equals(category) ? "application/json" : "text/plain");
            connection.setRequestProperty("Access-Control-Expose-Headers", "Content-Disposition");
            connection.setDoOutput(true);
            connection.getOutputStream().write(serializeData(data));

            byte[] responseBody = readResponse(connection.getInputStream());
            HttpHeaders headers = new HttpHeaders();
            if ("submit".equals(category)) {
                headers.set(HttpHeaders.CONTENT_TYPE, "application/json");
            }
            return ResponseEntity.ok().headers(headers).body(new String(responseBody, StandardCharsets.UTF_8));
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("The plugin " + name + " evaluate endpoint is not responding. Check that the plugin is active and running. " + e);
        }
    }

    private ResponseEntity<?> getRun(String pluginUrl, JsonNode data, String category, String name, String prefix) {
        try {
            JsonNode pluginData = data;
            String normalizedPrefix = (prefix == null || prefix.isBlank()) ? null : prefix;

            switch (category) {
                case "rendering":
                case "download":
                    pluginData = getPublicDataFromURI(data, normalizedPrefix);
                    break;
                case "submit":
                    break;
                default:
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Unsupported plugin category: " + category);
            }

            HttpURLConnection connection = openConnection(pluginUrl + "run", "POST", 60000);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            connection.getOutputStream().write(serializeData(pluginData));

            byte[] responseBody = readResponse(connection.getInputStream());
            HttpHeaders responseHeaders = new HttpHeaders();

            if ("download".equals(category)) {
                String disposition = connection.getHeaderField("Content-Disposition");
                String filename = "downloaded_file";
                if (disposition != null && disposition.contains("=")) {
                    filename = disposition.substring(disposition.indexOf('=') + 1).replace("\"", "").trim();
                }
                responseHeaders.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
                responseHeaders.set(HttpHeaders.CONTENT_TYPE, "application/octet-stream");
                responseHeaders.set("Access-Control-Expose-Headers", "Content-Disposition");
            }

            if ("rendering".equals(category)) {
                return ResponseEntity.ok().headers(responseHeaders).body(new String(responseBody, StandardCharsets.UTF_8));
            }

            return ResponseEntity.ok().headers(responseHeaders).body(responseBody);
        } catch (IOException e) {
            HttpHeaders responseHeaders = new HttpHeaders();
            responseHeaders.set(HttpHeaders.CONTENT_TYPE, "text/plain");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).headers(responseHeaders).body(e.toString());
        }
    }

    private JsonNode getPublicDataFromURI(JsonNode data, String prefix) throws IOException {
        if (data == null || data.isMissingNode() || !data.isObject()) {
            return data;
        }

        ObjectNode pluginData = data.deepCopy();
        String uriSuffix = data.path("uriSuffix").asText();
        String uri;

        if (prefix != null && !prefix.isBlank()) {
            uri = prefix + uriSuffix;
        } else {
            uri = ConfigUtil.get("instanceUrl").asText() + uriSuffix;
        }

        pluginData.put("complete_sbol", uri + "/sbol");
        pluginData.put("shallow_sbol", uri + "/sbolnr");
        pluginData.put("genbank", uri + "/gb");

        if (data.has("top")) {
            pluginData.set("top_level", data.get("top"));
        }

        return pluginData;
    }

    private HttpURLConnection openConnection(String endpoint, String method, int timeoutMs) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(endpoint).openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(timeoutMs);
        connection.setReadTimeout(timeoutMs);
        return connection;
    }

    private byte[] readResponse(InputStream inputStream) throws IOException {
        try (inputStream; ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            return outputStream.toByteArray();
        }
    }

    private byte[] serializeData(JsonNode data) throws JsonProcessingException {
        if (data == null || data.isMissingNode() || data.isNull()) {
            return new byte[0];
        }

        if (data.isTextual()) {
            return data.asText().getBytes(StandardCharsets.UTF_8);
        }

        return mapper.writeValueAsBytes(data);
    }

    public JsonNode buildManifest(List<MultipartFile> attached) throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        ObjectNode manifest = objectMapper.createObjectNode();
        ObjectNode files = objectMapper.createObjectNode();
        ArrayNode array = objectMapper.createArrayNode();

        for (MultipartFile file : attached) {
            ObjectNode curr = objectMapper.createObjectNode();

            String filename = file.getOriginalFilename();
            String type = URLConnection.guessContentTypeFromName(filename);
            String url = ConfigUtil.get("instanceUrl").asText() + "expose/";

            curr.put("filename", filename);
            curr.put("type", type == null ? "" : type);
            curr.put("url", url);
            array.add(curr);
        }

        files.set("files", array);
        manifest.set("manifest", files);

        return objectMapper.convertValue(manifest, JsonNode.class);
    }

    public JsonNode buildType(String type) {
        ObjectMapper objectMapper = new ObjectMapper();
        ObjectNode node = objectMapper.createObjectNode();
        node.put("type", type);
        return objectMapper.convertValue(node, JsonNode.class);
    }

    /**
     * Resolves a submit plugin config entry by array index or by {@code name}.
     */
    public String resolveSubmitPluginName(String pluginRef) throws IOException {
        if (pluginRef == null || pluginRef.isBlank() || "default".equalsIgnoreCase(pluginRef)) {
            return null;
        }
        JsonNode submitPlugins = ConfigUtil.get("plugins").get("submit");
        if (submitPlugins == null || !submitPlugins.isArray()) {
            throw new IllegalStateException("No submit plugins are configured.");
        }
        if (pluginRef.matches("\\d+")) {
            int index = Integer.parseInt(pluginRef);
            if (index < 0 || index >= submitPlugins.size()) {
                throw new IllegalArgumentException("Invalid submit plugin index: " + pluginRef);
            }
            String name = submitPlugins.get(index).path("name").asText(null);
            if (name == null || name.isBlank()) {
                throw new IllegalStateException("Submit plugin at index " + index + " has no name.");
            }
            return name;
        }
        for (JsonNode plugin : submitPlugins) {
            if (pluginRef.equals(plugin.path("name").asText())) {
                return pluginRef;
            }
        }
        throw new IllegalArgumentException("Unknown submit plugin: " + pluginRef);
    }

    public void checkSubmitPluginStatus(String pluginName) throws IOException {
        String pluginUrl = requireSubmitPluginUrl(pluginName);
        try {
            HttpURLConnection connection = openConnection(pluginUrl + "status", "GET", 5000);
            int code = connection.getResponseCode();
            if (code < 200 || code >= 300) {
                throw new IOException("HTTP " + code);
            }
        } catch (IOException e) {
            throw new IOException("The plugin " + pluginName
                    + " status endpoint is not responding. Check that the plugin is active and running.", e);
        }
    }

    public JsonNode evaluateSubmitPlugin(String pluginName, JsonNode evaluateManifest) throws IOException {
        String pluginUrl = requireSubmitPluginUrl(pluginName);
        try {
            HttpURLConnection connection = openConnection(pluginUrl + "evaluate", "POST", 10000);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Accept", "application/json");
            connection.setDoOutput(true);
            connection.getOutputStream().write(mapper.writeValueAsBytes(evaluateManifest));

            int code = connection.getResponseCode();
            byte[] responseBody = readResponse(
                    code >= 400 ? connection.getErrorStream() : connection.getInputStream());
            if (code < 200 || code >= 300) {
                throw new IOException(new String(responseBody, StandardCharsets.UTF_8));
            }
            return mapper.readTree(responseBody);
        } catch (IOException e) {
            throw new IOException("The plugin " + pluginName
                    + " evaluate endpoint is not responding. Check that the plugin is active and running.", e);
        }
    }

    public byte[] runSubmitPlugin(String pluginName, JsonNode runRequest) throws IOException {
        String pluginUrl = requireSubmitPluginUrl(pluginName);
        try {
            HttpURLConnection connection = openConnection(pluginUrl + "run", "POST", 120000);
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setDoOutput(true);
            connection.getOutputStream().write(mapper.writeValueAsBytes(runRequest));

            int code = connection.getResponseCode();
            byte[] responseBody = readResponse(
                    code >= 400 ? connection.getErrorStream() : connection.getInputStream());
            if (code < 200 || code >= 300) {
                throw new IOException(new String(responseBody, StandardCharsets.UTF_8));
            }
            return responseBody;
        } catch (IOException e) {
            throw new IOException("The plugin " + pluginName
                    + " run endpoint is not responding. Check that the plugin is active and running.", e);
        }
    }

    private String requireSubmitPluginUrl(String pluginName) throws IOException {
        String pluginUrl = findPluginUrl(pluginName, "submit");
        if (pluginUrl == null) {
            throw new IllegalArgumentException("Submit plugin not found: " + pluginName);
        }
        if (!pluginUrl.endsWith("/")) {
            pluginUrl = pluginUrl + "/";
        }
        return pluginUrl;
    }
}
