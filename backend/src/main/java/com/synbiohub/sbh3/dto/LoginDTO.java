package com.synbiohub.sbh3.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;


@Data
@Builder
public class LoginDTO {

    @NotBlank
    private String email;

    @NotBlank
    private String password;
}
