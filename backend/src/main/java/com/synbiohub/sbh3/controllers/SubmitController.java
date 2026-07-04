package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.services.SubmitService;
import com.synbiohub.sbh3.submit.SubmitPayload;
import lombok.RequiredArgsConstructor;
import org.sbolstandard.core2.SBOLValidationException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
}
