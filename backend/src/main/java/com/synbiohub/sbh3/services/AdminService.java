package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.security.model.Role;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.synbiohub.sbh3.dto.LogEntry;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.BufferedReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.zip.GZIPInputStream;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserService userService;
    private final SearchService searchService;
    private final PasswordEncoder passwordEncoder;
    private ObjectMapper mapper = new ObjectMapper();

    public JsonNode getStatus(HttpServletRequest request) throws Exception {
        String inputToken = request.getHeader("X-authorization");
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        ObjectNode status = mapper.createObjectNode();
        status.set("version", ConfigUtil.get("version"));
        status.set("instanceName", ConfigUtil.get("instanceName"));
        status.set("port", ConfigUtil.get("port"));
        status.set("sparqlEndpoint", ConfigUtil.get("sparqlEndpoint"));
        status.set("graphStoreEndpoint", ConfigUtil.get("graphStoreEndpoint"));
        status.set("defaultGraph", ConfigUtil.get("defaultGraph"));
        status.set("graphPrefix", ConfigUtil.get("graphPrefix"));
        status.set("firstLaunch", ConfigUtil.get("firstLaunch"));

        return (JsonNode) status;
    }

    public JsonNode getGraphStatus() throws Exception {
        // Single query to get graph URIs and their respective triple counts
        String sparql = """
            SELECT ?graph (COUNT(*) AS ?count) 
            WHERE { 
                GRAPH ?graph { ?s ?p ?o } 
            } 
            GROUP BY ?graph
            """;

        // Get raw JSON string from Virtuoso via SearchService
        String rawJson = searchService.SPARQLQuery(sparql);
        JsonNode root = mapper.readTree(rawJson);

        // We want to mimic the SBH1 return structure: [{graphUri: "...", numTriples: 123}, ...]
        ArrayNode responseArray = mapper.createArrayNode();

        JsonNode bindings = root.path("results").path("bindings");
        if (bindings.isArray()) {
            for (JsonNode binding : bindings) {
                ObjectNode graphInfo = mapper.createObjectNode();
                graphInfo.put("graphUri", binding.path("graph").path("value").asText());
                graphInfo.put("numTriples", binding.path("count").path("value").asInt());
                responseArray.add(graphInfo);
            }
        }

        return responseArray;
    }

    public String getTheme() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode json = mapper.createObjectNode();
        json.set("instanceName", ConfigUtil.get("instanceName"));
        json.set("frontPageText", ConfigUtil.get("frontPageText"));
        json.set("theme", ConfigUtil.get("theme"));
        json.set("themeParameters", ConfigUtil.get("themeParameters"));
        json.set("firstLaunch", ConfigUtil.get("firstLaunch"));
        String result = mapper.writeValueAsString(json);
        return result;
    }

    public Boolean getDatabaseStatus() {
        // BEFORE 1/27:
        SPARQLQuery statusQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/GetDatabaseStatus.sparql");
        try {
            var result = searchService.SPARQLQuery(statusQuery.getQuery());
            if (result.getBytes().length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (Exception e) {
            return false;
        }
    }

    public List<LogEntry> getLogs() throws IOException {
        return getLogs("spring.log");
    }

    public List<LogEntry> getLogs(String filename) throws IOException {
        String safeFilename = (filename == null || filename.isBlank()) ? "spring.log" : filename;
        Path dataDir = Paths.get(System.getProperty("user.dir"), "data").toAbsolutePath().normalize();
        Path requested = dataDir.resolve(safeFilename).normalize();

        // Prevent path traversal and constrain reads to data directory files only.
        if (!requested.startsWith(dataDir) || !Files.exists(requested) || !Files.isRegularFile(requested)) {
            throw new IOException("Requested log file is not available.");
        }

        String logContent = readLogContent(requested);
        List<LogEntry> logEntries = new ArrayList<>();
        String[] lines = logContent.split("\\r?\\n");

        // Pattern to match log levels: INFO, WARN, ERROR, DEBUG, TRACE (case-insensitive)
        Pattern levelPattern = Pattern.compile("\\b(INFO|WARN|ERROR|DEBUG|TRACE)\\b", Pattern.CASE_INSENSITIVE);

        for (String line : lines) {
            if (line.trim().isEmpty()) {
                continue; // Skip empty lines
            }

            String level = "info"; // Default level
            Matcher matcher = levelPattern.matcher(line);

            if (matcher.find()) {
                String matchedLevel = matcher.group(1).toUpperCase();
                // Map to lowercase versions
                switch (matchedLevel) {
                    case "INFO":
                        level = "info";
                        break;
                    case "WARN":
                        level = "warn";
                        break;
                    case "ERROR":
                        level = "error";
                        break;
                    case "DEBUG":
                        level = "debug";
                        break;
                    case "TRACE":
                        level = "debug"; // Map TRACE to debug
                        break;
                }
            }

            logEntries.add(new LogEntry(level, line));
        }

        return logEntries;
    }

    private String readLogContent(Path requested) throws IOException {
        if (requested.getFileName().toString().endsWith(".gz")) {
            StringBuilder sb = new StringBuilder();
            try (GZIPInputStream gzipInputStream = new GZIPInputStream(Files.newInputStream(requested));
                 InputStreamReader inputStreamReader = new InputStreamReader(gzipInputStream);
                 BufferedReader bufferedReader = new BufferedReader(inputStreamReader)) {
                String line;
                while ((line = bufferedReader.readLine()) != null) {
                    sb.append(line).append(System.lineSeparator());
                }
            }
            return sb.toString();
        }
        return Files.readString(requested);
    }

    /**
     * Lists log files under {@code data/} for the admin log viewer dropdown.
     * Response shape: {@code { "logs": [ { "filename", "title" }, ... ] }}.
     */
    public JsonNode listLogFiles() throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        ArrayNode logsArray = mapper.createArrayNode();
        Path dataDir = Paths.get(System.getProperty("user.dir"), "data");
        if (!Files.isDirectory(dataDir)) {
            ObjectNode root = mapper.createObjectNode();
            root.set("logs", logsArray);
            return root;
        }
        Pattern synbiohubDebug = Pattern.compile("^synbiohub-\\d{4}-\\d{2}-\\d{2}\\.debug(?:\\.\\d+)?$");
        List<Path> paths;
        try (Stream<Path> stream = Files.list(dataDir)) {
            paths = stream.filter(Files::isRegularFile)
                    .filter(p -> isListableLogFile(p.getFileName().toString(), synbiohubDebug))
                    .sorted(Comparator.comparing(p -> p.getFileName().toString()))
                    .collect(Collectors.toList());
        }
        for (Path p : paths) {
            String filename = p.getFileName().toString();
            ObjectNode entry = mapper.createObjectNode();
            entry.put("filename", filename);
            entry.put("title", logFileTitle(filename));
            logsArray.add(entry);
        }
        ObjectNode root = mapper.createObjectNode();
        root.set("logs", logsArray);
        return root;
    }

    private boolean isListableLogFile(String name, Pattern synbiohubDebug) {
        if ("spring.log".equals(name)) {
            return true;
        }
        if (name.startsWith("spring.log.")) {
            return true;
        }
        if (name.endsWith(".log")) {
            return true;
        }
        return synbiohubDebug.matcher(name).matches();
    }

    private String logFileTitle(String filename) {
        if ("spring.log".equals(filename)) {
            return "Current (spring.log)";
        }
        return filename;
    }

    public Boolean getSBOLExplorerStatus() throws IOException {
        return ConfigUtil.get("useSBOLExplorer").asBoolean();
    }

    public ArrayNode saveNewPlugin(Map<String, String> allParams) throws IOException {
        ArrayNode pluginArray = (ArrayNode) ConfigUtil.get("plugins").get(allParams.get("category"));
        if (!checkPluginName(pluginArray, allParams.get("name"))) {
            JsonNode pluginMap = castParamsToPlugin(allParams, pluginArray.size());
            pluginArray.add(pluginMap);
            log.info("Plugin: " + allParams.get("name") + " saved");
            return pluginArray;
        }
        log.error("Error saving new plugin: " + allParams.get("name"));
        return pluginArray;
    }

    public ArrayNode deletePlugin(String category, String id) throws IOException {
        JsonNode plugins = ConfigUtil.get("plugins").get(category);

        ArrayNode pluginArray = mapper.createArrayNode();
        if (plugins.isArray()) {
            pluginArray = (ArrayNode) plugins;
            for (int i = 0; i < pluginArray.size(); i++) {
                JsonNode innerNode = pluginArray.get(i);
                var temp1 = innerNode.get("index");
                if (innerNode.get("index").asInt() == (Integer.parseInt(id))) {
                    pluginArray.remove(i);
                    break;
                }
            }
        }
        return pluginArray;
    }

    public String updatePlugin(Map<String, String> allParams) throws IOException {
        return "Plugin updated";
    }

    public String getUsers() {
        ArrayNode usersArray = mapper.createArrayNode();

        for (User user : userService.getAllUsers()) {
            usersArray.add(
                    mapper.createObjectNode()
                            .put("id", user.getId())
                            .put("name", user.getName())
                            .put("username", user.getUsername())
                            .put("email", user.getEmail())
                            .put("affiliation", user.getAffiliation())
                            .put("graphUri", user.getGraphUri())
                            .put("isAdmin", Boolean.TRUE.equals(user.getIsAdmin()))
                            .put("isCurator", Boolean.TRUE.equals(user.getIsCurator()))
                            .put("isMember", Boolean.TRUE.equals(user.getIsMember()))
            );
        }

        ObjectNode response = mapper.createObjectNode().set("users", usersArray);
        try {
            response.put("allowPublicSignup", ConfigUtil.get("allowPublicSignup").asBoolean());
        } catch (Exception e) {
            response.put("allowPublicSignup", false);
        }
        return response.toString();
    }

    public String updateUsers(Map<String, String> allParams) throws IOException {
        boolean allowPublicSignup = Boolean.parseBoolean(allParams.getOrDefault("allowPublicSignup", "false"));

        if (!ConfigUtil.checkLocalJson("allowPublicSignup")) {
            ConfigUtil.set(ConfigUtil.getLocaljson(), "allowPublicSignup", ConfigUtil.get("allowPublicSignup"));
            ConfigUtil.refreshLocalJson();
        }

        ConfigUtil.set(ConfigUtil.getLocaljson(), "allowPublicSignup", allowPublicSignup);
        ConfigUtil.refreshLocalJson();
        return "Updated users configuration";
    }

    public String createNewUser(Map<String, String> allParams) throws IOException {
        String username = allParams.getOrDefault("username", "").trim();
        String name = allParams.getOrDefault("name", "").trim();
        String email = allParams.getOrDefault("email", "").trim();
        String affiliation = allParams.getOrDefault("affiliation", "").trim();

        if (username.isEmpty() || name.isEmpty() || email.isEmpty()) {
            return "Missing required fields: username, name, and email are required.";
        }
        if (!userService.isValidEmail(email)) {
            return "Please enter a valid email address.";
        }
        if (userService.getUserByUsername(username) != null) {
            return "Username already exists.";
        }
        if (userService.getUserByEmail(email) != null) {
            return "Email already exists.";
        }

        boolean isAdmin = parseBooleanParam(allParams.get("isAdmin"));
        boolean isCurator = parseBooleanParam(allParams.get("isCurator"));
        boolean isMember = parseBooleanParam(allParams.get("isMember"));

        // Admin and curator are independent toggles, but either implies membership.
        if (isAdmin || isCurator) {
            isMember = true;
        }

        Role role = Role.USER;
        if (isAdmin) {
            role = Role.ADMIN;
        } else if (isCurator) {
            role = Role.CURATOR;
        }

        String temporaryPassword = UUID.randomUUID().toString();
        String graphPrefix = ConfigUtil.get("graphPrefix").asText();
        User newUser = User.builder()
                .username(username)
                .name(name)
                .email(email)
                .affiliation(affiliation)
                .password(passwordEncoder.encode(temporaryPassword))
                .role(role)
                .graphUri(graphPrefix + "user/" + username)
                .isAdmin(isAdmin)
                .isCurator(isCurator)
                .isMember(isMember)
                .build();

        userService.createUser(newUser);
        return "User created successfully.";
    }

    public String deleteUser(Map<String, String> allParams) {
        String idParam = allParams.get("id");
        if (idParam == null || idParam.isBlank()) {
            return "Missing required field: id.";
        }

        Long userId;
        try {
            userId = Long.parseLong(idParam);
        } catch (NumberFormatException e) {
            return "Invalid user id.";
        }

        User targetUser = findUserById(userId);
        if (targetUser == null) {
            return "User not found.";
        }

        User currentUser = userService.getUserProfile();
        if (currentUser != null && currentUser.getId() != null && currentUser.getId().equals(userId)) {
            return "Cannot delete the currently logged in user.";
        }

        long adminCount = userService.getAllUsers().stream()
                .filter(user -> Boolean.TRUE.equals(user.getIsAdmin()))
                .count();
        if (Boolean.TRUE.equals(targetUser.getIsAdmin()) && adminCount <= 1) {
            return "Cannot delete the last administrator.";
        }

        userService.deleteUser(targetUser);
        return "User deleted successfully.";
    }

    public String updateUser(Map<String, String> allParams) {
        String idParam = allParams.get("id");
        if (idParam == null || idParam.isBlank()) {
            return "Missing required field: id.";
        }

        Long userId;
        try {
            userId = Long.parseLong(idParam);
        } catch (NumberFormatException e) {
            return "Invalid user id.";
        }

        User targetUser = findUserById(userId);
        if (targetUser == null) {
            return "User not found.";
        }

        String name = allParams.getOrDefault("name", "").trim();
        String email = allParams.getOrDefault("email", "").trim();
        String affiliation = allParams.getOrDefault("affiliation", "").trim();

        if (name.isEmpty() || email.isEmpty()) {
            return "Missing required fields: name and email are required.";
        }
        if (!userService.isValidEmail(email)) {
            return "Please enter a valid email address.";
        }

        User existingByEmail = userService.getUserByEmail(email);
        if (existingByEmail != null && !existingByEmail.getId().equals(targetUser.getId())) {
            return "Email already exists.";
        }

        boolean isAdmin = parseBooleanParam(allParams.get("isAdmin"));
        boolean isCurator = parseBooleanParam(allParams.get("isCurator"));
        boolean isMember = parseBooleanParam(allParams.get("isMember"));

        // Admin and curator are independent toggles, but either implies membership.
        if (isAdmin || isCurator) {
            isMember = true;
        }

        Role role = Role.USER;
        if (isAdmin) {
            role = Role.ADMIN;
        } else if (isCurator) {
            role = Role.CURATOR;
        }

        long adminCount = userService.getAllUsers().stream()
                .filter(user -> Boolean.TRUE.equals(user.getIsAdmin()))
                .count();
        if (Boolean.TRUE.equals(targetUser.getIsAdmin()) && !isAdmin && adminCount <= 1) {
            return "Cannot remove admin role from the last administrator.";
        }

        targetUser.setName(name);
        targetUser.setEmail(email);
        targetUser.setAffiliation(affiliation);
        targetUser.setRole(role);
        targetUser.setIsAdmin(isAdmin);
        targetUser.setIsCurator(isCurator);
        targetUser.setIsMember(isMember);

        userService.createUser(targetUser);
        return "User updated successfully.";
    }

    private User findUserById(Long userId) {
        return userService.getAllUsers().stream()
                .filter(user -> user.getId() != null && user.getId().equals(userId))
                .findFirst()
                .orElse(null);
    }

    private boolean parseBooleanParam(String value) {
        if (value == null) {
            return false;
        }
        return "true".equalsIgnoreCase(value) || "1".equals(value);
    }

    private ObjectNode castParamsToPlugin(Map<String, String> allParams, int arraySize) {
        ObjectMapper mapper = new ObjectMapper();
        ObjectNode pluginMap = mapper.createObjectNode();
        pluginMap.put("name", allParams.get("name"));
        pluginMap.put("url", allParams.get("url")+"/");
        pluginMap.put("index", arraySize);
        return pluginMap;
    }

    private Boolean checkPluginName(ArrayNode pluginArray, String name) {
        for (String n : pluginArray.findValuesAsText("name")) {
            if (n.equals(name)) {
                return true;
            }
        }
        return false;
    }
}
