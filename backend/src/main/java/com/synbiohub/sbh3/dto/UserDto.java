package com.synbiohub.sbh3.dto;

import com.synbiohub.sbh3.security.model.Role;
import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class UserDto {
    private Long id;
    private String name;
    private String username;
    private String email;
    private String affiliation;
    private Role role;
    private Boolean isAdmin;
    private Boolean isCurator;
    private Boolean isMember;
}
