package com.synbiohub.sbh3.entities.configentities;

import lombok.Data;

@Data
public class ExternalAuthEntity {
    private Boolean enabled;
    private String provider;
    private ExternalEntity externalEntity;
}
