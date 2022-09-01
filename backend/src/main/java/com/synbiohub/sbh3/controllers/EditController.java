package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.EditService;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.joda.time.DateTime;
import org.joda.time.format.DateTimeFormatter;
import org.joda.time.format.ISODateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

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
    @PostMapping(value = "/updateMutableDescription")
    @ResponseBody
    public ResponseEntity<String> updateMutableDescription(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
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

    @PostMapping(value = "/updateMutableNotes")
    @ResponseBody
    public ResponseEntity<String> updateMutableNotes(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/updateMutableSource")
    @ResponseBody
    public ResponseEntity<String> updateMutableSource(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/updateCitations")
    @ResponseBody
    public ResponseEntity<String> updateCitations(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/editField")
    @ResponseBody
    public ResponseEntity<String> editField(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/addField")
    @ResponseBody
    public ResponseEntity<String> addField(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/removeField")
    @ResponseBody
    public ResponseEntity<String> removeField(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/addToCollection")
    @ResponseBody
    public ResponseEntity<String> addToCollection(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/removeMembership")
    @ResponseBody
    public ResponseEntity<String> removeMembership(@RequestParam Map<String, String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        return new ResponseEntity<>(HttpStatus.OK);
    }
}

