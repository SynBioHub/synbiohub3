package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.EditService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@Tag(name = "Edit", description = "Endpoints for editing registry objects (Most are currently unimplemented stubs)")
@RestController
@RequiredArgsConstructor
public class EditController {

    private static final String USER_AUTH = "hasAnyAuthority('USER', 'CURATOR', 'ADMIN')";

    private final EditService editService;
    /**
     * Returns the metadata for the object from the specified search query.
     * @param allParams Key/value pairs of all parameters
     * @return Metadata for the object from the specified search query in JSON format
     */
    @Operation(summary = "Update mutable description", description = "Updates the description of an object via SPARQL query. Requires JWT in X-authorization header.")
    @ApiResponse(responseCode = "200", description = "Description updated successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize("hasAnyAuthority('USER', 'CURATOR', 'ADMIN')")
    @PostMapping(value = "/updateMutableDescription")
    @ResponseBody
    public ResponseEntity<String> updateMutableDescription(
            @Parameter(description = "Key/value pairs including uri and value") @RequestParam Map<String, String> allParams)
            throws IOException {
        return editService.updateMutableDescription(allParams);
    }

    @Operation(summary = "Update mutable notes", description = "Updates the notes of an object via SPARQL query. Requires JWT in X-authorization header.")
    @ApiResponse(responseCode = "200", description = "Notes updated successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize("hasAnyAuthority('USER', 'CURATOR', 'ADMIN')")
    @PostMapping(value = "/updateMutableNotes")
    @ResponseBody
    public ResponseEntity<String> updateMutableNotes(
            @Parameter(description = "Key/value pairs including uri and value") @RequestParam Map<String, String> allParams)
            throws IOException {
        return editService.updateMutableNotes(allParams);
    }

    @Operation(summary = "Update mutable source", description = "Updates the source/provenance of an object via SPARQL query. Requires JWT in X-authorization header.")
    @ApiResponse(responseCode = "200", description = "Source updated successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize("hasAnyAuthority('USER', 'CURATOR', 'ADMIN')")
    @PostMapping(value = "/updateMutableSource")
    @ResponseBody
    public ResponseEntity<String> updateMutableSource(
            @Parameter(description = "Key/value pairs including uri and value") @RequestParam Map<String, String> allParams)
            throws IOException {
        return editService.updateMutableSource(allParams);
    }

    @Operation(summary = "Update citations", description = "Replaces PubMed citation IDs on an object. Value is comma-separated PMIDs, or empty to clear. Requires JWT in X-authorization header.")
    @ApiResponse(responseCode = "200", description = "Citations updated successfully")
    @ApiResponse(responseCode = "400", description = "Invalid citation format")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize("hasAnyAuthority('USER', 'CURATOR', 'ADMIN')")
    @PostMapping(value = "/updateCitations")
    @ResponseBody
    public ResponseEntity<String> updateCitations(
            @Parameter(description = "Key/value pairs including uri and value") @RequestParam Map<String, String> allParams)
            throws IOException {
        return editService.updateCitations(allParams);
    }

    @Operation(summary = "Edit object field", description = "Updates a single RDF predicate on a private object. Body: object, previous (edit), pred (annotation).")
    @ApiResponse(responseCode = "200", description = "Field updated; plain-text display value returned")
    @ApiResponse(responseCode = "401", description = "Unauthorized or not the object owner")
    @PreAuthorize(USER_AUTH)
    @PostMapping(value = "/user/{userId}/{collectionId}/{displayId}/{version}/edit/{field}", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> editUserField(
            @PathVariable String userId,
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @PathVariable String field,
            @RequestBody Map<String, String> body) throws IOException {
        return editService.editField(false, userId, collectionId, displayId, version, field, body);
    }

    @Operation(summary = "Add object field value", description = "Adds a multi-valued RDF predicate on a private object.")
    @PreAuthorize(USER_AUTH)
    @PostMapping(value = "/user/{userId}/{collectionId}/{displayId}/{version}/add/{field}", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> addUserField(
            @PathVariable String userId,
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @PathVariable String field,
            @RequestBody Map<String, String> body) throws IOException {
        return editService.addField(false, userId, collectionId, displayId, version, field, body);
    }

    @Operation(summary = "Remove object field value", description = "Removes one RDF predicate value from a private object.")
    @PreAuthorize(USER_AUTH)
    @PostMapping(value = "/user/{userId}/{collectionId}/{displayId}/{version}/remove/{field}")
    public ResponseEntity<String> removeUserField(
            @PathVariable String userId,
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @PathVariable String field,
            @RequestBody Map<String, String> body) throws IOException {
        return editService.removeField(false, userId, collectionId, displayId, version, field, body);
    }

    @Operation(summary = "Edit public object field", description = "Admin-only edit on a public object.")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping(value = "/public/{collectionId}/{displayId}/{version}/edit/{field}", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> editPublicField(
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @PathVariable String field,
            @RequestBody Map<String, String> body) throws IOException {
        return editService.editField(true, null, collectionId, displayId, version, field, body);
    }

    @Operation(summary = "Add public object field value", description = "Admin-only add on a public object.")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping(value = "/public/{collectionId}/{displayId}/{version}/add/{field}", produces = "text/plain;charset=UTF-8")
    public ResponseEntity<String> addPublicField(
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @PathVariable String field,
            @RequestBody Map<String, String> body) throws IOException {
        return editService.addField(true, null, collectionId, displayId, version, field, body);
    }

    @Operation(summary = "Remove public object field value", description = "Admin-only remove on a public object.")
    @PreAuthorize("hasAuthority('ADMIN')")
    @PostMapping(value = "/public/{collectionId}/{displayId}/{version}/remove/{field}")
    public ResponseEntity<String> removePublicField(
            @PathVariable String collectionId,
            @PathVariable String displayId,
            @PathVariable String version,
            @PathVariable String field,
            @RequestBody Map<String, String> body) throws IOException {
        return editService.removeField(true, null, collectionId, displayId, version, field, body);
    }

    @Operation(summary = "Edit field (Unimplemented)", description = "Deprecated stub; use …/edit/{field} on the object URL.", deprecated = true)
    @PostMapping(value = "/editField")
    @ResponseBody
    public ResponseEntity<String> editField(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Add field (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/addField")
    @ResponseBody
    public ResponseEntity<String> addField(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Remove field (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/removeField")
    @ResponseBody
    public ResponseEntity<String> removeField(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Add to collection (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/addToCollection")
    @ResponseBody
    public ResponseEntity<String> addToCollection(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Remove membership (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/removeMembership")
    @ResponseBody
    public ResponseEntity<String> removeMembership(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }
}

