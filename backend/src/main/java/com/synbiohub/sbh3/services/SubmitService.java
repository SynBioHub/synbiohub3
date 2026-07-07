package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.submit.SubmitPayload;
import org.sbolstandard.core2.SBOLValidationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface SubmitService {
    static final String UNKNOWN_ATTACHMENT_TYPE = "http://wiki.synbiohub.org/wiki/Terms/synbiohub#unknownAttachment";

    public ResponseEntity<String> submit(SubmitPayload allParams, MultipartFile file) throws IOException, SBOLValidationException;
}
