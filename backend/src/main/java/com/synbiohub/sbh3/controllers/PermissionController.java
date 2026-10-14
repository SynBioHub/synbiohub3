package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.services.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@Tag(name = "Permissions", description = "Endpoints for managing ownership and access control")
@RestController
@RequiredArgsConstructor
@Slf4j
public class PermissionController {

    private static final String USER_AUTH = "hasAnyAuthority('USER', 'CURATOR', 'ADMIN')";

    private final PermissionService permissionService;

    @Operation(summary = "Add owner", description = "Adds an sbh:ownedBy owner to a private object and all of its child objects, and adds it to the new owner's shared list (sbh:canView). Form: user (username, email, or user URI), uri (object URI).")
    @ApiResponse(responseCode = "200", description = "Owner added successfully")
    @ApiResponse(responseCode = "400", description = "Missing user or uri, or user not recognized")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize(USER_AUTH)
    @PostMapping(value = "/user/{userId}/{collectionId}/{displayId}/{version}/addOwner", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> addUserOwner(
            @PathVariable String userId,
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @Parameter(description = "Key/value pairs including user and optional uri") @RequestParam Map<String, String> allParams)
            throws IOException {
        String subjectUri = permissionService.buildSubjectUri(false, userId, collectionId, displayId, version);
        return permissionService.addOwner(subjectUri, allParams.get("user"));
    }

    @Operation(summary = "Remove owner", description = "Removes an sbh:ownedBy owner from a private object and all of its child objects, and removes it from that user's shared list (sbh:canView). Path username and/or userUri (form or JSON).")
    @ApiResponse(responseCode = "200", description = "Owner removed successfully")
    @ApiResponse(responseCode = "400", description = "Missing username / userUri")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize(USER_AUTH)
    @PostMapping(value = "/user/{userId}/{collectionId}/{displayId}/{version}/removeOwner/{username}", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> removeUserOwner(
            @PathVariable String userId,
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @PathVariable String username,
            @RequestParam(required = false) Map<String, String> allParams,
            @RequestBody(required = false) Map<String, String> body)
            throws IOException {
        String subjectUri = permissionService.buildSubjectUri(false, userId, collectionId, displayId, version);
        return permissionService.removeOwner(subjectUri, username, userUriFrom(allParams, body));
    }

    @Operation(summary = "Add owner (public)", description = "Adds an sbh:ownedBy owner to a public object. Caller must already own the object.")
    @ApiResponse(responseCode = "200", description = "Owner added successfully")
    @ApiResponse(responseCode = "400", description = "Missing user or uri")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize(USER_AUTH)
    @PostMapping(value = "/public/{collectionId}/{displayId}/{version}/addOwner", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> addPublicOwner(
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @Parameter(description = "Key/value pairs including user and optional uri") @RequestParam Map<String, String> allParams)
            throws IOException {
        String subjectUri = permissionService.buildSubjectUri(true, null, collectionId, displayId, version);
        return permissionService.addOwner(subjectUri, allParams.get("user"));
    }

    @Operation(summary = "Remove owner (public)", description = "Removes an sbh:ownedBy owner from a public object. Caller must already own the object.")
    @ApiResponse(responseCode = "200", description = "Owner removed successfully")
    @ApiResponse(responseCode = "400", description = "Missing username / userUri")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize(USER_AUTH)
    @PostMapping(value = "/public/{collectionId}/{displayId}/{version}/removeOwner/{username}", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> removePublicOwner(
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @PathVariable String username,
            @RequestParam(required = false) Map<String, String> allParams,
            @RequestBody(required = false) Map<String, String> body)
            throws IOException {
        String subjectUri = permissionService.buildSubjectUri(true, null, collectionId, displayId, version);
        return permissionService.removeOwner(subjectUri, username, userUriFrom(allParams, body));
    }

    @Operation(summary = "Add owner (flat)", description = "Wiki-compatible flat alias. Form: user (username or user URI), uri (object URI).")
    @ApiResponse(responseCode = "200", description = "Owner added successfully")
    @ApiResponse(responseCode = "400", description = "Missing user or uri")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize(USER_AUTH)
    @PostMapping(value = "/addOwner", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> addOwner(
            @Parameter(description = "Key/value pairs including uri and user") @RequestParam Map<String, String> allParams)
            throws IOException {
        return permissionService.addOwner(allParams.get("uri"), allParams.get("user"));
    }

    private static String userUriFrom(Map<String, String> params, Map<String, String> body) {
        if (params != null && params.get("userUri") != null && !params.get("userUri").isBlank()) {
            return params.get("userUri");
        }
        if (body != null && body.get("userUri") != null && !body.get("userUri").isBlank()) {
            return body.get("userUri");
        }
        return null;
    }
}
