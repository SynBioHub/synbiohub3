package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.services.PluginService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@AllArgsConstructor
@Slf4j
public class PluginController {

    private final PluginService pluginService;

    @GetMapping(value = "/admin/plugins", produces = "application/json")
    @ResponseBody
    public String getPlugins(@RequestParam(required = false) String category) throws IOException {

        if (category == null) {
            return ConfigUtil.get("plugins").toString();
        } else {
            return ConfigUtil.get("plugins").get(category).toString();
        }
    }

    @PostMapping(value = "/callPlugin")
    public ResponseEntity<?> callPlugin(@RequestBody JsonNode requestBody) {
        return pluginService.callPlugin(requestBody);
    }
}
