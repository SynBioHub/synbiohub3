package com.synbiohub.sbh3.admin;

import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@AllArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping(value = "/admin")
    @ResponseBody
    public String status(@RequestParam Map<String,String> allParams, HttpServletRequest request) {
        return adminService.getStatus().toString();
    }
}
