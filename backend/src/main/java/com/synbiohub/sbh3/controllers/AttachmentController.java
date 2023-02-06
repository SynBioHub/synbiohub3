package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.AttachmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class AttachmentController {

    @PostMapping(value = "/attach")
    public ResponseEntity<String> attach(@RequestParam String file) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/attachURL")
    public ResponseEntity<String> attachURL(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping(value = "/download") //Returns the source for an attachment to the specified URI.
    public String download() {
        return null;
    }
}