package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.dto.configuration.ConfigurationResponse;
import com.synbiohub.sbh3.dto.configuration.GetConfigurationRequest;
import com.synbiohub.sbh3.dto.instance.CreateInstanceRequest;
import com.synbiohub.sbh3.dto.instance.InstanceResponse;
import com.synbiohub.sbh3.dto.configuration.UpdateConfigurationRequest;
import com.synbiohub.sbh3.dto.instance.UpdateInstanceRequest;
import com.synbiohub.sbh3.services.InstanceService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@AllArgsConstructor
@RequestMapping("/instances")
public class InstanceController {

    private final InstanceService instanceService;

    @PostMapping
    public ResponseEntity<InstanceResponse> create(@RequestBody CreateInstanceRequest request) {
        return ResponseEntity.ok(instanceService.create(request));
    }

    @PutMapping("/{instanceId}")
    public ResponseEntity<InstanceResponse> update(@RequestBody UpdateInstanceRequest request, @PathVariable Long instanceId) {

        return ResponseEntity.ok(instanceService.update(request, instanceId));
    }

    @PutMapping("/{instanceId}/configurations/{configurationId}")
    public ResponseEntity<ConfigurationResponse> updateConfigurations(@RequestBody UpdateConfigurationRequest request, @PathVariable Long instanceId, @PathVariable Long configurationId) {

        return ResponseEntity.ok(instanceService.updateConfigurations(request, instanceId, configurationId));
    }

    @GetMapping("/{instanceId}/configurations/{configurationId}")
    public ResponseEntity<ConfigurationResponse> getConfiguration(@RequestBody GetConfigurationRequest request, @PathVariable Long instanceId, @PathVariable Long configurationId) {
        return ResponseEntity.ok(instanceService.getConfiguration(request, instanceId, configurationId));
    }

}
