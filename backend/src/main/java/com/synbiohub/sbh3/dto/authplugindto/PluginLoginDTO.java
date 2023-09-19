package com.synbiohub.sbh3.dto.authplugindto;

import lombok.Data;


@Data
public class PluginLoginDTO {
    private String server;
    private String username;
    private String password;
    private String email;

    private String action;

    private String loginToken;
    private String refreshToken;
}
