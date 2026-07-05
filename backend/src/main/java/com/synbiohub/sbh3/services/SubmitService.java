package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.submit.SubmitPayload;
import org.sbolstandard.core2.SBOLValidationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

public interface SubmitService {

    // SPARQL templates used during prepare (overwrite) and upload (attachments).
    static final String REMOVE_COLLECTION_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/removeCollection.sparql";
    static final String REMOVE_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/remove.sparql";
    static final String GET_ATTACHMENT_SOURCE_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/GetAttachmentSourceFromTopLevel.sparql";
    static final String ATTACH_UPLOAD_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/AttachUpload.sparql";
    static final String UPDATE_ATTACHMENT_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/UpdateAttachment.sparql";
    static final String ATTACHMENT_UPDATE_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/AttachmentUpdate.sparql";
    static final String UNKNOWN_ATTACHMENT_TYPE = "http://wiki.synbiohub.org/wiki/Terms/synbiohub#unknownAttachment";

    public ResponseEntity<String> submit(SubmitPayload allParams, MultipartFile file) throws IOException, SBOLValidationException;
}
