package com.synbiohub.sbh3.entities.configentities;

import lombok.Data;

@Data
public class ExternalEntity {
    private String name;
    private String clientId;
    private String clientSecret;
    private String callbackUrl;
}
