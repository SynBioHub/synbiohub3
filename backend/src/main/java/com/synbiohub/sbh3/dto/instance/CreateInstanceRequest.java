package com.synbiohub.sbh3.dto.instance;

import lombok.Data;

@Data
public class CreateInstanceRequest {

    private String instanceName;
    private String instanceURL;
    private String uriPrefix;
    private String userName;
    private String affiliation;
    private String userFullName;
    private String userEmail;
    private String color;
    private String userPassword;
    private String userPasswordConfirm;
    private String frontPageText;
    private String virtuosoINI;
    private String virtuosoDB;
    private Boolean allowPublicSignup;

    private String defaultGraph;
    private String themeName;
    private String sparqlEndpoint;
    private String graphStoreEndpoint;
    private String graphPrefix;
    private String isql;
    private Integer port;

    private Boolean isAdmin;
    private Boolean isCurator;
}


