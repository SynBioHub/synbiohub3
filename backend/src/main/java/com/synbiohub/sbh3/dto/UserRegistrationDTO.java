package com.synbiohub.sbh3.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;


@Data
public class UserRegistrationDTO {

    @NotBlank
    private String username;

    @NotBlank
    private String name;

    @NotBlank
    private String affiliation;

    @NotBlank
    private String email;

    @NotBlank
    private String password1;

    @NotBlank
    private String password2;
}
