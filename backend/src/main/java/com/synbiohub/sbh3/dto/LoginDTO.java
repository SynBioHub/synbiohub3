package com.synbiohub.sbh3.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class LoginDTO {

    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
