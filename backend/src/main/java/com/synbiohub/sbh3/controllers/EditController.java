package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.EditService;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.ISODateTimeFormat;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@Tag(name = "Edit", description = "Endpoints for editing registry objects (Most are currently unimplemented stubs)")
@RestController
@RequiredArgsConstructor
@Slf4j
public class EditController {

    private final UserService userService;

    private final EditService editService;
    /**
     * Returns the metadata for the object from the specified search query.
     * @param allParams Key/value pairs of all parameters
     * @return Metadata for the object from the specified search query in JSON format
     */
    @Operation(summary = "Update mutable description", description = "Updates the description of an object via SPARQL query.")
    @ApiResponse(responseCode = "200", description = "Description updated successfully")
    @ApiResponse(responseCode = "401", description = "Unauthorized")
    @PostMapping(value = "/updateMutableDescription")
    @ResponseBody
    public ResponseEntity<String> updateMutableDescription(@Parameter(description = "Key/value pairs including uri and value") @RequestParam Map<String, String> allParams, @Parameter(description = "JWT Token") @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws IOException {
        String topLevelUri = allParams.get("uri");
        String value = allParams.get("value");
        if (!userService.validateXAuth(xauth) || !userService.isOwnedBy(topLevelUri))
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        SPARQLQuery sparqlQuery = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/UpdateMutableDescription.sparql");
        DateTimeFormatter dtf = ISODateTimeFormat.dateHourMinuteSecond();
        String query = sparqlQuery.loadTemplate(Map.of("desc", value, "topLevel", topLevelUri, "modified", dtf.print(DateTime.now())));
        log.debug(query);
        editService.AuthSPARQLQuery(query);

        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Update mutable notes (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/updateMutableNotes")
    @ResponseBody
    public ResponseEntity<String> updateMutableNotes(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Update mutable source (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/updateMutableSource")
    @ResponseBody
    public ResponseEntity<String> updateMutableSource(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Update citations (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/updateCitations")
    @ResponseBody
    public ResponseEntity<String> updateCitations(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Edit field (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
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

