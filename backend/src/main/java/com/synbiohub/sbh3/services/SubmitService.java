package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.submit.SubmitPayload;
import org.sbolstandard.core2.SBOLValidationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import javax.xml.namespace.QName;
import java.io.IOException;
import java.util.Set;
import java.util.regex.Pattern;

public interface SubmitService {
    static final ObjectMapper JSON = new ObjectMapper();

    /**
     * Office uploads are passed through to SBOL validation (SynBioHub Excel plugin
     * path).
     */
    static final Set<String> OFFICE_EXTENSIONS = Set.of(
            "xlsx", "xls", "docx", "doc", "pptx", "ppt");
    static final QName DC_CREATOR = new QName("http://purl.org/dc/elements/1.1/", "creator", "dc");
    static final QName DCTERMS_CREATED = new QName("http://purl.org/dc/terms/", "created", "dcterms");
    static final QName OBO_PUBMED = new QName("http://purl.obolibrary.org/obo/", "OBI_0001617", "obo");
    // SynBioHub-specific annotation QNames used when annotating submitted objects.
    static final QName SBH_OWNED_BY = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#", "ownedBy", "sbh");
    static final QName SBH_TOP_LEVEL = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#", "topLevel", "sbh");
    static final QName SBH_MUTABLE_DESCRIPTION = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#",
            "mutableDescription", "sbh");
    static final QName SBH_MUTABLE_NOTES = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#", "mutableNotes",
            "sbh");
    static final QName SBH_MUTABLE_PROVENANCE = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#",
            "mutableProvenance", "sbh");
    static final QName SBH_IS_MEMBER_OF = new QName("http://wiki.synbiohub.org/wiki/Terms/synbiohub#", "isMemberOf",
            "sbh");

    // SPARQL templates used during prepare (overwrite) and upload (attachments).
    static final String REMOVE_COLLECTION_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/removeCollection.sparql";
    static final String REMOVE_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/remove.sparql";
    static final String GET_ATTACHMENT_SOURCE_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/GetAttachmentSourceFromTopLevel.sparql";
    static final String ATTACH_UPLOAD_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/AttachUpload.sparql";
    static final String UPDATE_ATTACHMENT_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/UpdateAttachment.sparql";
    static final String ATTACHMENT_UPDATE_SPARQL = "src/main/java/com/synbiohub/sbh3/sparql/AttachmentUpdate.sparql";
    static final String UNKNOWN_ATTACHMENT_TYPE = "http://wiki.synbiohub.org/wiki/Terms/synbiohub#unknownAttachment";
    /**
     * Rewrites {@code img src="/user/.../"} paths in mutable HTML to the public
     * collection path.
     */
    static final Pattern MUTABLE_IMG_USER_PATH = Pattern.compile("img src=\\\"/user/[^/]*/[^/]*/");

    public ResponseEntity<String> submit(SubmitPayload allParams, MultipartFile file) throws IOException, SBOLValidationException;
}
