package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.services.PluginService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@Tag(name = "Plugins", description = "Endpoints for viewing and interacting with external plugins")
@RestController
@AllArgsConstructor
@Slf4j
public class PluginController {

    private final PluginService pluginService;

    @Operation(summary = "Get configured plugins", description = "Retrieves a JSON object of plugins, optionally filtered by category.")
    @ApiResponse(responseCode = "200", description = "JSON configuration of plugins")
    @GetMapping(value = "/admin/plugins", produces = "application/json")
    @ResponseBody
    public String getPlugins(@Parameter(description = "Optional plugin category (e.g. submit, download)") @RequestParam(required = false) String category) throws IOException {

        if (category == null) {
            return ConfigUtil.get("plugins").toString();
        } else {
            return ConfigUtil.get("plugins").get(category).toString();
        }
    }

    @Operation(summary = "Call an external plugin", description = "Forwards a JSON request payload to a configured external plugin.")
    @ApiResponse(responseCode = "200", description = "Response from the plugin")
    @PostMapping(value = "/callPlugin")
    public ResponseEntity<?> callPlugin(@RequestBody JsonNode requestBody) {
        return pluginService.callPlugin(requestBody);
    }
}
