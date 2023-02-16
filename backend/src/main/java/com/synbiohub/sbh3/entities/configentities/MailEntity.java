package com.synbiohub.sbh3.entities.configentities;

import lombok.Data;

@Data
public class MailEntity {
    private String sendgridApiKey;
    private String fromAddress;
}
