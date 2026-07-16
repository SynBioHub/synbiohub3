package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.AttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Attachments", description = "Endpoints for managing file attachments and URLs (Currently Unimplemented)")
@RestController
@RequiredArgsConstructor
@Slf4j
public class AttachmentController {

    @Operation(summary = "Attach file (Unimplemented)", description = "Uploads and attaches a file. Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/attach")
    public ResponseEntity<String> attach(@Parameter(description = "The file to attach") @RequestParam String file) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Attach URL (Unimplemented)", description = "Attaches a remote URL. Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/attachURL")
    public ResponseEntity<String> attachURL(@Parameter(description = "Parameters for attaching the URL") @RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Download attachment (Unimplemented)", description = "Returns the source for an attachment to the specified URI. Currently an empty stub.", deprecated = true)
    @GetMapping(value = "/download") 
    public String download() {
        return null;
    }
}