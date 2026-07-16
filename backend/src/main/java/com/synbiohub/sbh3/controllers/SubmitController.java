package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.dto.SubmissionDTO;

import com.synbiohub.sbh3.requests.SubmitRequest;
import com.synbiohub.sbh3.services.SubmitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.SBOLDocument;
import org.sbolstandard.core2.SBOLValidationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Submissions", description = "Endpoints for creating and submitting registry objects")
@RestController
@RequiredArgsConstructor
@Slf4j
public class SubmitController {
    private final SubmitService submitService;

    @Operation(summary = "Submit object", description = "Submits a new object to the registry.")
    @PostMapping(value = "/submit")
    public String submit(@Parameter(description = "Key/value pairs for the submission") @RequestParam Map<String, String> allParams, Model model) throws SBOLValidationException {
        SubmitRequest submitRequest = submitService.createSubmitRequest(allParams);
        SubmissionDTO submissionDTO = submitService.createSubmissionDTO(submitRequest);
        model.addAttribute("submitForm", submissionDTO);
        return "Form submitted";
    }

    @Operation(summary = "Create new collection (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/newCollection")
    public void createNewCollection(@RequestBody(required = false) Map<String, String> submissionData) {

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
    public void removeCollection(@RequestBody(required = false) SubmissionDTO submissionDTO) {

    }

    @Operation(summary = "Remove object form (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @GetMapping(value = "/remove")
    public void removeObject(@RequestParam Map<String, String> allParams) {

    }

    @Operation(summary = "Remove object (Unimplemented)", description = "Currently an empty stub.", deprecated = true)
    @DeleteMapping(value = "/remove")
    public void removeObject(@RequestBody(required = false) SBOLDocument sbolDocument, @RequestParam(required = false) String objectID) {

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