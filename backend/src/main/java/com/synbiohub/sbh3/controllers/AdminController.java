package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.services.AdminService;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@AllArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final UserService userService;

    @GetMapping(value = "/admin")
    @ResponseBody
    public String status(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return adminService.getStatus().toString();
    }

    @GetMapping(value = "/admin/plugins")
    @ResponseBody
    public String getPlugins(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return ConfigUtil.get("plugins").toString();
    }
}
