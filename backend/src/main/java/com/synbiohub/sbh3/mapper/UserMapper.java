package com.synbiohub.sbh3.mapper;

import com.synbiohub.sbh3.dto.instance.CreateInstanceRequest;
import com.synbiohub.sbh3.security.model.Role;
import com.synbiohub.sbh3.security.model.User;
import org.mapstruct.Mapping;
import org.mapstruct.ValueMapping;

public interface UserMapper {

    @Mapping(source = "userName", target = "username")
    @Mapping(source = "userPassword", target = "password")
    @Mapping(source = "userFullName", target = "name")
    @Mapping(source = "userEmail", target = "email")
    @Mapping(source = "affiliation", target = "affiliation")
    @ValueMapping(source = "role", target = "USER") // maybe use @EnumMapping?
    User toUser(CreateInstanceRequest request);
}
