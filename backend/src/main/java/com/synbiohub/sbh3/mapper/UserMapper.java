package com.synbiohub.sbh3.mapper;

import com.synbiohub.sbh3.dto.UserDto;
import com.synbiohub.sbh3.security.model.Role;
import com.synbiohub.sbh3.security.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper(imports = Role.class)
public interface UserMapper {

    UserMapper INSTANCE = Mappers.getMapper(UserMapper.class);

    @Mapping(target = "password", ignore = true)
    @Mapping(target = "graphUri", ignore = true)
    User toUser(UserDto dto);

    @Mapping(target = "isAdmin", expression = "java(roleEquals(user.getRole(), Role.ADMIN))")
    @Mapping(target = "isCurator", expression = "java(roleEquals(user.getRole(), Role.CURATOR))")
    @Mapping(target = "isMember", expression = "java(roleEquals(user.getRole(), Role.USER))")
    UserDto toDto(User user);

    default boolean roleEquals(Role actual, Role expected) {
        return actual != null && actual == expected;
    }
}
