package com.synbiohub.sbh3.dto.instance;

import lombok.Data;

@Data
public class UpdateInstanceRequest {
    private Long id;
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
}
