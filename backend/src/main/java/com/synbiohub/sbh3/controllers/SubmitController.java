package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.services.SubmitService;
import com.synbiohub.sbh3.submit.SubmitPayload;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.sbolstandard.core2.SBOLDocument;
import org.sbolstandard.core2.SBOLValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Tag(name = "Submissions", description = "Endpoints for creating and submitting registry objects")
@RestController
@RequiredArgsConstructor
public class SubmitController {
    private final SubmitService submitService;

    /**
     * Create a new collection or submit file contents into an existing collection.
     * <p>
     * String form fields are bound via {@code allParams} (e.g. id, version, name, description,
     * citations, overwrite_merge, rootCollections, plugin). The uploaded design file is bound
     * separately because multipart files are not included in a {@code Map<String, String>}.
     */
    @PostMapping(value = "/submit",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = "text/plain; charset=UTF-8")
    public ResponseEntity<String> submit(
            @ModelAttribute SubmitPayload allParams,
            @RequestPart(value = "file", required = false) MultipartFile file) throws IOException, SBOLValidationException {
        return submitService.submit(allParams, file);
    }

    @Operation(summary = "Create new collection (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/newCollection")
    public void createNewCollection(@RequestParam(required = false) Map<String, String> submissionData) {

    }

    @Operation(summary = "Make object public (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/makePublic")
    public ResponseEntity<String> makePublic(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Remove collection form (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @GetMapping(value = "/removeCollection")
    public void removeCollection(@RequestParam Map<String, String> allParams) {

    }

    @Operation(summary = "Remove collection (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @DeleteMapping(value = "/removeCollection")
    public void removeCollection(@RequestBody(required = false) String submission) {

    }

    @Operation(summary = "Remove object form (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @GetMapping(value = "/remove")
    public void removeObject(@RequestParam Map<String, String> allParams) {

    }

    @Operation(summary = "Replace object (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @GetMapping(value = "/replace")
    public void replaceObject(@RequestParam Map<String, String> allParams) {
        //should just call remove object then add object
    }

    @Operation(summary = "Add object (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/add")
    public void addObject(@RequestBody(required = false) SBOLDocument sbolDocument) {

    }

    @Operation(summary = "Update icon (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/icon")
    public ResponseEntity<String> updateIcon(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }
}
