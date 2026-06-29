package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.dto.SubmissionDTO;
import com.synbiohub.sbh3.dto.submit.ParsedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitRootCollectionMetadata;
import com.synbiohub.sbh3.dto.submit.PrepareSubmissionFailedException;
import com.synbiohub.sbh3.dto.submit.PrepareSubmissionResult;
import com.synbiohub.sbh3.dto.submit.SubmitConflictException;
import com.synbiohub.sbh3.dto.submit.SubmitUnauthorizedException;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.services.PrepareSubmissionPayloadService;
import com.synbiohub.sbh3.services.PrepareSubmissionService;
import com.synbiohub.sbh3.services.SubmitCollectionEnrichmentService;
import com.synbiohub.sbh3.services.SubmitCollectionLookupService;
import com.synbiohub.sbh3.services.SubmitParseService;
import com.synbiohub.sbh3.services.SubmitSanitizationService;
import com.synbiohub.sbh3.services.SubmitPersistService;
import com.synbiohub.sbh3.services.SubmitPostMetadataService;
import com.synbiohub.sbh3.services.UserService;
import lombok.RequiredArgsConstructor;
import org.sbolstandard.core2.SBOLDocument;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
public class SubmitController {

    private final SubmitParseService submitParseService;
    private final SubmitCollectionEnrichmentService submitCollectionEnrichmentService;
    private final SubmitSanitizationService submitSanitizationService;
    private final SubmitCollectionLookupService submitCollectionLookupService;
    private final SubmitPostMetadataService submitPostMetadataService;
    private final PrepareSubmissionPayloadService prepareSubmissionPayloadService;
    private final PrepareSubmissionService prepareSubmissionService;
    private final SubmitPersistService submitPersistService;
    private final UserService userService;

    /** Parse, sanitize, SPARQL collection check, then legacy merge or overwrite rules. */
    @PostMapping(value = "/submit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> submitMultipart(MultipartHttpServletRequest request) {
        return handleSubmit(request, () -> submitParseService.parseMultipart(request, requireUser()));
    }

    @PostMapping(value = "/submit", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> submitFormUrlEncoded(HttpServletRequest request) {
        return handleSubmit(request, () -> submitParseService.parseUrlEncoded(request, requireUser()));
    }

    private User requireUser() {
        User user = userService.getUserProfile();
        if (user == null) {
            throw new SubmitUnauthorizedException("Must be logged in to submit");
        }
        return user;
    }

    private ResponseEntity<?> handleSubmit(HttpServletRequest request, ParsedPayloadSupplier supplier) {
        try {
            ParsedSubmitPayload parsed = supplier.get();
            parsed = submitCollectionEnrichmentService.enrichFromCollectionUri(parsed);
            SanitizedSubmitPayload sanitized = submitSanitizationService.sanitizeSubmission(parsed);
            Optional<SubmitRootCollectionMetadata> existing =
                    submitCollectionLookupService.getRootCollectionMetadata(sanitized);
            SanitizedSubmitPayload response =
                    submitPostMetadataService.applyLegacyMetadataRules(sanitized, existing);
            JsonNode prepareJson = prepareSubmissionPayloadService.buildPrepareSubmissionJson(
                    response,
                    null,
                    request.getHeader("X-authorization"));
            PrepareSubmissionResult prepareResult = prepareSubmissionService.run(prepareJson);
            submitPersistService.persistAfterPrepare(response, prepareResult);

            if (acceptsHtml(request)) {
                HttpHeaders headers = new HttpHeaders();
                headers.setLocation(java.net.URI.create(collectionRedirectPath(response)));
                return new ResponseEntity<>(headers, HttpStatus.FOUND);
            }
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("Successfully uploaded");
        } catch (SubmitUnauthorizedException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("errors", List.of(e.getMessage())));
        } catch (PrepareSubmissionFailedException e) {
            if (prefersPlainTextErrors(request)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(e.getMessage());
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("errors", List.of(e.getMessage())));
        } catch (SubmitConflictException e) {
            if (prefersPlainTextErrors(request)) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .contentType(MediaType.TEXT_PLAIN)
                        .body(e.getMessage());
            }
            return ResponseEntity.badRequest()
                    .body(Map.of("errors", List.of(e.getMessage())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("errors", List.of(e.getMessage())));
        } catch (IOException | InterruptedException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("errors", List.of(
                            e.getMessage() != null ? e.getMessage() : "Could not store upload")));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("errors", List.of(
                            e.getMessage() != null ? e.getMessage() : "Prepare submission failed")));
        }
    }

    private static boolean prefersPlainTextErrors(HttpServletRequest request) {
        if (Boolean.parseBoolean(request.getHeader("X-Force-No-HTML"))) {
            return true;
        }
        String param = request.getParameter("forceNoHtml");
        if (param != null && Boolean.parseBoolean(param)) {
            return true;
        }
        String accept = request.getHeader("Accept");
        if (accept == null || accept.isBlank()) {
            return true;
        }
        return !accept.contains("text/html");
    }

    private static boolean acceptsHtml(HttpServletRequest request) {
        String accept = request.getHeader("Accept");
        return accept != null && accept.contains("text/html");
    }

    private static String collectionRedirectPath(SanitizedSubmitPayload submission) {
        String encUser = SubmitSanitizationService.encodeURIComponent(
                submission.getCreatedBy().getUsername());
        return "/user/" + encUser + "/" + submission.getId() + "/"
                + submission.getCollectionId() + "/" + submission.getVersion();
    }

    @FunctionalInterface
    private interface ParsedPayloadSupplier {
        ParsedSubmitPayload get() throws IOException;
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
