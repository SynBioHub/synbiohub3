package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.dto.configuration.ConfigurationResponse;
import com.synbiohub.sbh3.dto.configuration.GetConfigurationRequest;
import com.synbiohub.sbh3.dto.instance.CreateInstanceRequest;
import com.synbiohub.sbh3.dto.instance.InstanceResponse;
import com.synbiohub.sbh3.dto.configuration.UpdateConfigurationRequest;
import com.synbiohub.sbh3.dto.instance.UpdateInstanceRequest;
import com.synbiohub.sbh3.services.InstanceService;
import lombok.AllArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Instances", description = "Endpoints for managing SynBioHub instances and configurations")
@RestController
@AllArgsConstructor
@RequestMapping("/instances")
public class InstanceController {

    private final InstanceService instanceService;

    @Operation(summary = "Create instance", description = "Creates a new SynBioHub instance record.")
    @PostMapping
    public ResponseEntity<InstanceResponse> create(@RequestBody CreateInstanceRequest request) {
        return ResponseEntity.ok(instanceService.create(request));
    }

    @Operation(summary = "Update instance", description = "Updates an existing SynBioHub instance by ID.")
    @PutMapping("/{instanceId}")
    public ResponseEntity<InstanceResponse> update(@RequestBody UpdateInstanceRequest request, @Parameter(description = "ID of the instance") @PathVariable Long instanceId) {
        return ResponseEntity.ok(instanceService.update(request, instanceId));
    }

    @Operation(summary = "Update instance configurations", description = "Updates the configuration for a specific instance.")
    @PutMapping("/{instanceId}/configurations/{configurationId}")
    public ResponseEntity<ConfigurationResponse> updateConfigurations(@RequestBody UpdateConfigurationRequest request, @Parameter(description = "ID of the instance") @PathVariable Long instanceId, @Parameter(description = "ID of the configuration") @PathVariable Long configurationId) {
        return ResponseEntity.ok(instanceService.updateConfigurations(request, instanceId, configurationId));
    }

    @Operation(summary = "Get instance configuration", description = "Retrieves the configuration for a specific instance.")
    @GetMapping("/{instanceId}/configurations/{configurationId}")
    public ResponseEntity<ConfigurationResponse> getConfiguration(@RequestBody GetConfigurationRequest request, @Parameter(description = "ID of the instance") @PathVariable Long instanceId, @Parameter(description = "ID of the configuration") @PathVariable Long configurationId) {
        return ResponseEntity.ok(instanceService.getConfiguration(request, instanceId, configurationId));
    }

}
