package com.synbiohub.sbh3.submit;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.services.PluginService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Runs the submit-plugin evaluate/run flow and replaces {@link SubmitPayload#getUploadedFilePath()}
 * with converted SBOL from the plugin zip response.
 */
@Service
@RequiredArgsConstructor
public class SubmitPluginService {

    private final PluginService pluginService;
    private final SubmitExposeRegistry exposeRegistry;
    private final ObjectMapper mapper;

    public void applySubmitPlugin(SubmitPayload payload) throws IOException {
        if (payload.getUploadedFilePath() == null || isDefaultPlugin(payload.getPlugin())) {
            return;
        }

        String pluginName = pluginService.resolveSubmitPluginName(payload.getPlugin());
        pluginService.checkSubmitPluginStatus(pluginName);

        Path inputFile = Path.of(payload.getUploadedFilePath());
        String filename = inputFile.getFileName().toString();
        String mimeType = URLConnection.guessContentTypeFromName(filename);
        if (mimeType == null) {
            mimeType = "application/octet-stream";
        }

        String exposeUrl = exposeRegistry.register(inputFile);
        String exposeToken = exposeUrl.substring(exposeUrl.lastIndexOf('/') + 1);

        try {
            ObjectNode evaluateManifest = buildPluginManifest(exposeUrl, filename, mimeType, false);
            JsonNode evaluateResponse = pluginService.evaluateSubmitPlugin(pluginName, evaluateManifest);
            if (!pluginCanConvert(evaluateResponse, filename)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "The plugin " + pluginName + " requires a different file type.");
            }

            ObjectNode runRequest = buildPluginManifest(exposeUrl, filename, mimeType, true);
            byte[] zipBytes = pluginService.runSubmitPlugin(pluginName, runRequest);
            payload.setUploadedFilePath(extractConvertedSbolPath(zipBytes, inputFile.getParent()));
        } finally {
            exposeRegistry.revoke(exposeToken);
        }
    }

    private static boolean isDefaultPlugin(String plugin) {
        return plugin == null || plugin.isBlank() || "default".equalsIgnoreCase(plugin);
    }

    private ObjectNode buildPluginManifest(String exposeUrl, String filename, String mimeType,
                                           boolean includeInstanceUrl) throws IOException {
        ObjectNode file = mapper.createObjectNode();
        file.put("url", exposeUrl);
        file.put("filename", filename);
        file.put("type", mimeType);

        ArrayNode files = mapper.createArrayNode();
        files.add(file);

        ObjectNode manifest = mapper.createObjectNode();
        manifest.set("files", files);
        if (includeInstanceUrl) {
            manifest.put("instanceUrl", ConfigUtil.get("instanceUrl").asText());
        }

        ObjectNode root = mapper.createObjectNode();
        root.set("manifest", manifest);
        return root;
    }

    private boolean pluginCanConvert(JsonNode evaluateResponse, String filename) {
        JsonNode manifest = evaluateResponse.path("manifest");
        if (!manifest.isArray()) {
            return false;
        }
        for (JsonNode entry : manifest) {
            if (filename.equals(entry.path("filename").asText())
                    && entry.path("requirement").asInt(0) == 2) {
                return true;
            }
        }
        return false;
    }

    private String extractConvertedSbolPath(byte[] zipBytes, Path tempDir) throws IOException {
        Path extractDir = Files.createTempDirectory(tempDir, "sbh-plugin-out-");
        Path manifestPath = null;
        List<String> resultFilenames = new ArrayList<>();

        try (ZipInputStream zis = new ZipInputStream(new java.io.ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }
                Path out = extractDir.resolve(entry.getName()).normalize();
                if (!out.startsWith(extractDir)) {
                    throw new IOException("Invalid zip entry path");
                }
                Files.createDirectories(out.getParent());
                Files.copy(zis, out);
                if ("manifest.json".equalsIgnoreCase(entry.getName())) {
                    manifestPath = out;
                }
                zis.closeEntry();
            }
        }

        if (manifestPath != null && Files.exists(manifestPath)) {
            JsonNode manifest = mapper.readTree(manifestPath.toFile());
            for (JsonNode result : manifest.path("results")) {
                resultFilenames.add(result.path("filename").asText());
            }
        }

        for (String resultName : resultFilenames) {
            Path candidate = extractDir.resolve(resultName);
            if (Files.isRegularFile(candidate)) {
                return candidate.toAbsolutePath().toString();
            }
        }

        try (var stream = Files.list(extractDir)) {
            return stream
                    .filter(Files::isRegularFile)
                    .filter(p -> !"manifest.json".equalsIgnoreCase(p.getFileName().toString()))
                    .filter(p -> isSbolLike(p.getFileName().toString()))
                    .findFirst()
                    .map(p -> p.toAbsolutePath().toString())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                            "Submit plugin did not return a convertible SBOL file."));
        }
    }

    private static boolean isSbolLike(String name) {
        String ext = FilenameUtils.getExtension(name);
        if (ext == null) {
            return false;
        }
        return switch (ext.toLowerCase()) {
            case "xml", "sbol", "rdf" -> true;
            default -> name.contains(".converted");
        };
    }
}
