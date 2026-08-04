package com.synbiohub.sbh3.mapper;

import com.synbiohub.sbh3.dto.UserDto;
import com.synbiohub.sbh3.security.model.Role;
import com.synbiohub.sbh3.security.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;
import com.synbiohub.sbh3.dto.UserRegistrationDTO;

@Mapper(imports = Role.class)
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @Mapping(target = "password", ignore = true)
    User toUser(UserDto dto);

    @Mapping(target = "isAdmin", expression = "java(roleEquals(user.getRole(), Role.ADMIN))")
    @Mapping(target = "isCurator", expression = "java(roleEquals(user.getRole(), Role.CURATOR))")
    @Mapping(target = "isMember", expression = "java(roleEquals(user.getRole(), Role.USER))")
    UserDto toDto(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(source = "password1", target = "password") // raw for now; encode in service
    @Mapping(target = "graphUri", ignore = true)
    @Mapping(target = "isAdmin", ignore = true) // if still on User
    @Mapping(target = "isCurator", ignore = true)
    @Mapping(target = "isMember", ignore = true)
    User toUser(UserRegistrationDTO dto);

    default boolean roleEquals(Role actual, Role expected) {
        return actual != null && actual == expected;
    }
}
