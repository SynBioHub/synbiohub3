package com.synbiohub.sbh3.dto;

import lombok.Data;


@Data
public class PluginLoginDTO {
    private String loginUrl;
    private String username;
    private String password;
    private String email;
}
