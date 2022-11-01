package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.dto.SubmissionDTO;

import com.synbiohub.sbh3.requests.SubmitRequest;
import com.synbiohub.sbh3.services.SubmitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.SBOLDocument;
import org.sbolstandard.core2.SBOLValidationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SubmitController {
    private final SubmitService submitService;

    @PostMapping(value = "/submit")
    public String submit(@RequestParam Map<String, String> allParams, Model model) throws SBOLValidationException {
        SubmitRequest submitRequest = submitService.createSubmitRequest(allParams);
        SubmissionDTO submissionDTO = submitService.createSubmissionDTO(submitRequest);
        model.addAttribute("submitForm", submissionDTO);
        return "Form submitted";
    }

    @PostMapping(value = "/newCollection")
    public void createNewCollection(Map<String, String> submissionData) {

    }




    @PostMapping(value = "/makePublic")
    public ResponseEntity<String> makePublic(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping(value = "/removeCollection")
    public void removeCollection(@RequestParam Map<String, String> allParams) {

    }

    @DeleteMapping(value = "/removeCollection")
    public void removeCollection(SubmissionDTO submissionDTO) {

    }

    @GetMapping(value = "/remove")
    public void removeObject(@RequestParam Map<String, String> allParams) {

    }

    @DeleteMapping(value = "/remove")
    public void removeObject(SBOLDocument sbolDocument, String objectID) {

    }

    @GetMapping(value = "/replace")
    public void replaceObject(@RequestParam Map<String, String> allParams) {
        //should just call remove object then add object
    }

    @PostMapping(value = "/add")
    public void addObject(SBOLDocument sbolDocument) {

    }

    @PostMapping(value = "/icon")
    public ResponseEntity<String> updateIcon(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }
}