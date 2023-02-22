package com.synbiohub.sbh3.requests;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.io.File;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@Builder
public class SubmitRequest {
    private String name;
    private String description;
    private String id;
    private String version;

    private String citations;
    private List<File> files;
    private String overwriteMerge;
    private String plugins;
}
