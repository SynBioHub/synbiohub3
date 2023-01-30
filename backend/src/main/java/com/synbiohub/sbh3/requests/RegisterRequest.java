package com.synbiohub.sbh3.requests;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    private String username;

    private String name;

    private String affiliation;

    private String email;

    private String password1;

    private String password2;
}
