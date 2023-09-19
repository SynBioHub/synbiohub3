package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.PermissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PermissionController {

    @PostMapping(value = "/addOwner")
    public ResponseEntity<String> addOwner(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/removeOwner/**")
    public ResponseEntity<String> removeOwner(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth) {
        return new ResponseEntity<>(HttpStatus.OK);
    }
}