package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.security.CustomUserService;
import com.synbiohub.sbh3.services.SearchService;

import com.synbiohub.sbh3.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SubmitController {

    @PostMapping(value = "/submit")
    public ResponseEntity<String> submit(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/makePublic")
    public ResponseEntity<String> makePublic(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping(value = "/removeCollection")
    public void removeCollection(@RequestParam Map<String, String> allParams) {

    }

    @GetMapping(value = "/remove")
    public void removeObject(@RequestParam Map<String, String> allParams) {

    }

    @GetMapping(value = "/replace")
    public void replaceObject(@RequestParam Map<String, String> allParams) {

    }

    @PostMapping(value = "/icon")
    public ResponseEntity<String> updateIcon(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }
}