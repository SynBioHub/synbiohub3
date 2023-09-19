package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dto.SubmissionDTO;
import com.synbiohub.sbh3.requests.SubmitRequest;
import com.synbiohub.sbh3.utils.ObjectMapperUtils;
import lombok.RequiredArgsConstructor;
import org.sbolstandard.core2.*;
import org.springframework.stereotype.Service;
import org.apache.commons.io.FilenameUtils;

import java.io.File;
import java.util.*;
import java.util.Collection;

@Service
@RequiredArgsConstructor

public class SubmitService {

    public SubmissionDTO createSubmissionDTO(SubmitRequest submitRequest) throws SBOLValidationException {
        if (Integer.parseInt(submitRequest.getOverwriteMerge()) <= 1) {
            return createSubmissionWithNewCollection(submitRequest);
        } else {
            return createSubmissionWithoutNewCollection(submitRequest);
        }
    }

    public SubmissionDTO createSubmissionWithNewCollection(SubmitRequest submitRequest) throws SBOLValidationException {
        String id = parseID(submitRequest);
        String name = parseName(submitRequest);
        String description = parseDescription(submitRequest);
        int version = parseVersion(submitRequest);
        List<Integer> citations = parseCitations(submitRequest);
        Collection<File> allFiles = new ArrayList<>();
        Collection<File> attachmentFiles = new ArrayList<>();
        String fileType = FilenameUtils.getExtension(submitRequest.getFiles().get(0).getAbsolutePath()); // currently, only one file can be submitted at a time, may change in the future
        if (fileType.equalsIgnoreCase(".xlsx")) {
            //send to excel2sbol plugin
        }
        if ((fileType.equalsIgnoreCase(".omex")) || fileType.equals(".zip")) {
            // parse out files and keep sbol ones but send other ones to become attachment files
        }

        allFiles.forEach(file -> {
            if (checkForSBOL(file)) {
                verifyFile(file);
            } else {
                attachmentFiles.add(file);
                allFiles.remove(file);
            }
        });
        SBOLDocument doc = new SBOLDocument();
        String URIPrefix = createURIPrefix(""); //TODO: get URI prefix from submitRequest
        doc.setDefaultURIprefix(URIPrefix);
        org.sbolstandard.core2.Collection rootCollection = null;
        try {
            rootCollection = doc.createCollection(URIPrefix, id, String.valueOf(version)); //not sure what to do with rootCollection here
        } catch (Exception e) {
            System.out.println("This exact collection already exists.");
            return null;
        }
        updateAnnotations(doc);
        updateSBOLExplorer(doc);

        if (submitRequest.getOverwriteMerge().equalsIgnoreCase("1")) {
            //TODO get existing collection and members to delete for overwrite for removal later
        }
        SubmissionDTO submissionDTO = ObjectMapperUtils.createNewSubmission(name, description, id, version, citations, allFiles, Integer.parseInt(submitRequest.getOverwriteMerge()), new ArrayList<>(), attachmentFiles, doc);
        uploadToVirtuoso(submissionDTO);
        uploadAttachmentFiles(submissionDTO);

        // TODO remove existing collection and members for overwrite

        return submissionDTO; // this will change,
    }

    public SubmissionDTO createSubmissionWithoutNewCollection(SubmitRequest submitRequest) {
        return null;
    }

    public SubmitRequest createSubmitRequest(Map<String, String> allParams) { //maps the request params to the fields listed above
        return null;
    }

    private String parseID(SubmitRequest submitRequest) {
        return submitRequest.getId();
    }

    private String parseName(SubmitRequest submitRequest) {
        return submitRequest.getName();
    }

    private String parseDescription(SubmitRequest submitRequest) {
        return submitRequest.getDescription();
    }

    private int parseVersion(SubmitRequest submitRequest) {
        return Integer.parseInt(submitRequest.getVersion());
    }

    private List<Integer> parseCitations(SubmitRequest submitRequest) {
        return handleCitations(submitRequest.getCitations());
    }


    public List<Integer> handleCitations(String citations) { //change the inputted string of citations into a list of citations
        return null;
    }


    public void verifyFile(File file) {

    }

    public Boolean checkForSBOL(File file) {
        // if is in sbol, then return true
        // else
            // if file is not in sbol, check to see if it can be converted
                // it can be converted, then go to convertToSBOL
                // else, return false
        return true;
    }

    public void convertToSBOL() {

    }

    public void SBOL2ToSBOL3() {
        // to be implemented in the future
    }

    public String createURIPrefix(String str) {
        return "";
    }

    public void updateAnnotations(SBOLDocument sbolDocument) {

    }

    public void updateSBOLExplorer(SBOLDocument sbolDocument) {

    }

    public void checkObject(SBOLDocument sbolDocument) { //check if the submission object already exists in the collection, only for OM = 2,3

    }

    public void uploadToVirtuoso(SubmissionDTO submissionDTO) {

    }

    public void uploadAttachmentFiles(SubmissionDTO submissionDTO) {

    }
}
