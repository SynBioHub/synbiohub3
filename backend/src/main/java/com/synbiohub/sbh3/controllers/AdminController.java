package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.services.AdminService;
import com.synbiohub.sbh3.services.SearchService;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
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
     * @param allParams
     * @param request
     * @return
     */
    @GetMapping(value = "/admin/virtuoso")
    @ResponseBody
    public String getVirtuosoStatus(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        boolean vStatus = adminService.getDatabaseStatus();
        return vStatus ? "Alive" : "Dead";
    }

    @GetMapping(value = "/admin/graphs")
    @ResponseBody
    public String getGraph(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        // Returns graphUri and Count of Triples in the graph
        return null;
    }

    @GetMapping(value = "/admin/log")
    @ResponseBody
    public String getLog(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        // prints the spring.log?
        return null;
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
    public String savePlugin(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/deletePlugin")
    @ResponseBody
    public String deletePlugin(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @GetMapping(value = "/admin/registries")
    @ResponseBody
    public JsonNode getRegistries() throws IOException {
        return ConfigUtil.get("webOfRegistries");

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
    public String setAdminEmail(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
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
    public String getRemotes(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        // TODO: need to check format of remotes
        return null;
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

    @PostMapping(value = "/admin/explorerUpdateIndex")
    @ResponseBody
    public String updateExplorerIndex(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
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
