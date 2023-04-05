package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.services.AdminService;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.json.JSONObject;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@AllArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    @GetMapping(value = "/admin/sparql")
    @ResponseBody
    public String runAdminSparqlQuery(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @GetMapping(value = "/admin")
    @ResponseBody
    public String status(@RequestParam Map<String,String> allParams, HttpServletRequest request) throws IOException {
        return adminService.getStatus().toString();
    }

    @GetMapping(value = "/admin/virtuoso")
    @ResponseBody
    public String getVirtuosoStatus(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @GetMapping(value = "/admin/graphs")
    @ResponseBody
    public String getGraph(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @GetMapping(value = "/admin/log")
    @ResponseBody
    public String getLog(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
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

//    @GetMapping(value = "/admin/plugins")
//    @ResponseBody
//    public String getPlugins(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
//        return ConfigUtil.get("plugins").toString();
//    }

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
    public String getRegistries(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/saveRegistry")
    @ResponseBody
    public String saveRegistry(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/deleteRegistry")
    @ResponseBody
    public String deleteRegistry(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
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
        return null;
    }

    @GetMapping(value = "/admin/remotes")
    @ResponseBody
    public String getRemotes(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/saveRemote") //benchling and ice remotes have different params
    @ResponseBody
    public String saveRemote(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @PostMapping(value = "/admin/deleteRemote")
    @ResponseBody
    public String deleteRemote(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return null;
    }

    @GetMapping(value = "/admin/explorerlog")
    @ResponseBody
    public String getExplorerLog(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
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
