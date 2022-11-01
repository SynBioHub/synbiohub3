package com.synbiohub.sbh3.dto;

import lombok.Builder;
import lombok.Data;
import org.sbolstandard.core2.SBOLDocument;

import java.io.File;
import java.util.Collection;
import java.util.List;

@Data
@Builder
public class SubmissionDTO {
    private String name;
    private String description;
    private String id;
    private Integer version;

    private List<Integer> citations;
    private Collection<File> files;
    private Integer overwriteMerge;
    private List<String> plugins;
    private Collection<File> attachments;
    private SBOLDocument sbolDocument;
    // TODO: add rootcollections

}
