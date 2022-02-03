package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.synbiohub.sbh3.services.EditService;
import com.synbiohub.sbh3.services.SPARQLQuery;
import com.synbiohub.sbh3.services.UserService;
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
    public ResponseEntity<String> getResults(@RequestParam Map<String,String> allParams, @RequestHeader("X-authorization") String xauth, HttpServletRequest request) throws JsonProcessingException {
        String topLevelUri = allParams.get("uri");
        String value = allParams.get("value");
        if (!userService.validateXAuth(xauth) || !userService.isOwnedBy(topLevelUri))
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);

        SPARQLQuery sparqlQuery = new SPARQLQuery("src/main/resources/sparql/UpdateMutableDescription.sparql");
        DateTimeFormatter dtf = ISODateTimeFormat.dateHourMinuteSecond();
        String query = sparqlQuery.loadTemplate(Map.of("desc", value, "topLevel", topLevelUri, "modified", dtf.print(DateTime.now())));
        log.debug(query);
        editService.AuthSPARQLQuery(query);

        return new ResponseEntity<>(HttpStatus.OK);
    }
}

