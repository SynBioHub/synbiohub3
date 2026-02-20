package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.synbiohub.sbh3.dto.LogEntry;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.services.AdminService;
import com.synbiohub.sbh3.services.SearchService;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@AllArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;
    private final SearchService searchService;
    @GetMapping(value = "/admin/sparql")
    @ResponseBody
    public String runAdminSparqlQuery(@RequestParam String query, HttpServletRequest request) throws Exception {
        String inputToken = request.getHeader("X-authorization");
//        Authentication auth = userService.checkAuthentication(inputToken);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return null;
        }
        return searchService.SPARQLQuery(query);
    }

    @GetMapping(value = "/admin")
    @ResponseBody
    public String status(@RequestParam Map<String,String> allParams, HttpServletRequest request) throws Exception {
        return adminService.getStatus(request).toString();
    }

    /**
     * This will just run a basic query on Virtuoso. If the result exists, return "Alive". Otherwise, return "Dead".
     * @return
     */
    @GetMapping(value = "/admin/virtuoso")
    @ResponseBody
    // to mimic sbh api docs: "return 500 when it is not [alive]"
    public ResponseEntity<String> getVirtuosoStatus() {
        boolean vStatus = adminService.getDatabaseStatus();
        if (vStatus) {
            return ResponseEntity.ok("Alive");
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Dead");
        }
    }

    @GetMapping(value = "/admin/graphs")
    @ResponseBody
    public ResponseEntity<String> getGraph(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        // Returns graphUri and Count of Triples in the graph
        try {
            // Optional: Implement security check here (check if user is Admin)
            JsonNode graphs = adminService.getGraphStatus();
            return ResponseEntity.ok(graphs.toString());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping(value = "/admin/log")
    @ResponseBody
    public ResponseEntity<JsonNode> getLog(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        try {
            List<LogEntry> logEntries = adminService.getLogs();
            ObjectMapper mapper = new ObjectMapper();
            ArrayNode jsonArray = mapper.valueToTree(logEntries);
            return ResponseEntity.ok(jsonArray);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping(value = "/admin/mail")
    @ResponseBody
    public String getMailSettings(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/mail")
    @ResponseBody
    public String updateMailSettings(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    //TODO: get admin plugins needs to be public, post admin plugins need to be admin only
    @GetMapping(value = "/admin/plugins")
    @ResponseBody
    public String getPlugins(@RequestParam Map<String,String> allParams, HttpServletRequest request) throws IOException {
        return ConfigUtil.get("plugins").toString();
    }

    @PostMapping(value = "/admin/savePlugin")
    @ResponseBody
    public String savePlugin(@RequestParam Map<String,String> allParams, HttpServletRequest request) throws IOException {
        if (!ConfigUtil.checkLocalJson("plugins")) {
            ConfigUtil.set(ConfigUtil.getLocaljson(),"plugins", ConfigUtil.get("plugins"));
            ConfigUtil.refreshLocalJson();
        }
        ObjectMapper mapper = new ObjectMapper();
        if (allParams.get("id").equals("New")) {
            int pluginArraySize = ConfigUtil.get("plugins").get(allParams.get("category")).size();
            ArrayNode pluginArray = adminService.saveNewPlugin(allParams);
            if (pluginArraySize != pluginArray.size()) {
                mapper.writerWithDefaultPrettyPrinter().writeValue(new File("data/config.local.json"), ConfigUtil.getLocaljson());
                return "Plugin (New, " + allParams.get("name") + ", " + allParams.get("url") + "/, " + allParams.get("category") + ") saved successfully";
            } else {
                return "Error saving new plugin: " + allParams.get("name");
            }
        } else {
            adminService.updatePlugin(allParams);
            return "Plugin " + allParams.get("name") + " updated.";
        }
    }

    @PostMapping(value = "/admin/deletePlugin")
    @ResponseBody
    public String deletePlugin(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            adminService.deletePlugin(allParams.get("category"), allParams.get("id"));
            mapper.writerWithDefaultPrettyPrinter().writeValue(new File("data/config.local.json"), ConfigUtil.getLocaljson());
            return "Plugin ("+ allParams.get("id") + ", " + allParams.get("category") + ") deleted successfully";
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping(value = "/admin/registries")
    @ResponseBody
    public JsonNode getRegistries() throws IOException {
        try {
            JsonNode webOfRegistries = ConfigUtil.get("webOfRegistries");
            ObjectMapper mapper = new ObjectMapper();
            ObjectNode result = mapper.createObjectNode();
            ArrayNode registriesArray = mapper.createArrayNode();
            
            // Convert the object format {uri: url} to array format [{uri: "...", url: "..."}]
            if (webOfRegistries.isObject()) {
                webOfRegistries.fields().forEachRemaining(entry -> {
                    ObjectNode registryEntry = mapper.createObjectNode();
                    registryEntry.put("uri", entry.getKey());
                    registryEntry.put("url", entry.getValue().asText());
                    registriesArray.add(registryEntry);
                });
            }
            
            result.set("registries", registriesArray);
            return result;
        } catch (IOException e) {
            e.printStackTrace();
            // Optionally, handle the exception or log more details here.
            throw e; // rethrow the exception if you want to maintain the current method signature
        }
    }

    @PostMapping(value = "/admin/saveRegistry")
    @ResponseBody
    public void saveRegistry(@RequestBody Map<String, String> newWebOfRegistry) {
        // TODO: need to check format of web of registries
    }

    @PostMapping(value = "/admin/deleteRegistry")
    @ResponseBody
    public void deleteRegistry(@RequestBody String webOfRegistryName) {
        // TODO: need to check format of web of registries
    }

    @PostMapping(value = "/admin/setAdministratorEmail")
    @ResponseBody
    public String setAdminEmail(String newEmail) throws Exception {
        User adminUser = userService.getUserProfile();
        try {
            if (adminUser.getIsAdmin()) {
                Map<String, String> params = new HashMap<>();
                params.put("email", newEmail);
                userService.updateUserProfile(params);
                return "Updated administrator email";
            }
        } catch (Exception e) {
            return "Unable to update administrator email " + e.getMessage();
        }
        return "Unable to update administrator email, but no error was thrown";
    }

    @PostMapping(value = "/admin/retrieveFromWebOfRegistries")
    @ResponseBody
    public String updateRegistries(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/federate")
    @ResponseBody
    public String sendFederateRequest(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return "This is send Federate Request. It is not yet implemented.";
    }

    @GetMapping(value = "/admin/remotes")
    @ResponseBody
    public String getRemotes() throws IOException {
        // TODO: need to check format of remotes
        return ConfigUtil.get("remotes").toString();
    }

    @PostMapping(value = "/admin/saveRemote") //benchling and ice remotes have different params
    @ResponseBody
    public void saveRemote(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        // TODO: need to check format of remotes
    }

    @PostMapping(value = "/admin/deleteRemote")
    @ResponseBody
    public void deleteRemote(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        // TODO: need to check format of remotes
    }

    @GetMapping(value = "/admin/explorerlog")
    @ResponseBody
    public String getExplorerLog() {
        return null;
    }

    @GetMapping(value = "/admin/explorer")
    @ResponseBody
    public String getExplorerConfig(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/explorer")
    @ResponseBody
    public String updateExplorerConfig(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    /**
     * I am not sure what this should be. It is a post request, but right now, all it's doing is getting the status
     * @return
     */
    // TODO: check if this method should be returning SBOL Explorer status
    @PostMapping(value = "/admin/explorerUpdateIndex")
    @ResponseBody
    public String updateExplorerIndex() throws IOException {
        boolean SBOLExplorerStatus = adminService.getSBOLExplorerStatus();
        return SBOLExplorerStatus ? "SBOLExplorer is not enabled" : "SBOLExplorer is enabled";
    }

    //TODO: get admin theme needs to be public, post admin theme needs to be admin only
    @GetMapping(value = "/admin/theme")
    @ResponseBody
    public String getTheme() throws IOException {
        return adminService.getTheme();
    }

    @PostMapping(value = "/admin/theme")
    @ResponseBody
    public String updateTheme(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @GetMapping(value = "/admin/users")
    @ResponseBody
    public String getUsers(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/users")
    @ResponseBody
    public String updateUsers(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/newUser")
    @ResponseBody
    public String createNewUser(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/updateUser")
    @ResponseBody
    public String updateUser(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/deleteUser")
    @ResponseBody
    public String deleteUser(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }





}
