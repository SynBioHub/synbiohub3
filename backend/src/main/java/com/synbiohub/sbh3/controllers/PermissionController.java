package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Permissions", description = "Endpoints for managing ownership and access control (Currently Unimplemented)")
@RestController
@RequiredArgsConstructor
@Slf4j
public class PermissionController {

    @Operation(summary = "Add owner (Unimplemented)", description = "Adds an owner to a registry object. Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/addOwner")
    public ResponseEntity<String> addOwner(@Parameter(description = "Key/value pairs including uri and user email") @RequestParam Map<String, String> allParams, @Parameter(description = "JWT Token") @RequestHeader("X-authorization") String xauth) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Remove owner (Unimplemented)", description = "Removes an owner from a registry object. Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/removeOwner/**")
    public ResponseEntity<String> removeOwner(@Parameter(description = "Key/value pairs including uri and user email") @RequestParam Map<String, String> allParams, @Parameter(description = "JWT Token") @RequestHeader("X-authorization") String xauth) {
        return new ResponseEntity<>(HttpStatus.OK);
    }
}