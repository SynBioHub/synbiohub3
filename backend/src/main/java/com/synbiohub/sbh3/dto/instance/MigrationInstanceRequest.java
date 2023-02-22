package com.synbiohub.sbh3.dto.instance;

import com.synbiohub.sbh3.security.model.User;
import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class MigrationInstanceRequest {

    private String instanceName;
    private String instanceURL;
    private String uriPrefix;
    private String color;
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
    private Set<User> users;
}
