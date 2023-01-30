package com.synbiohub.sbh3.mapper;

import com.synbiohub.sbh3.dto.configuration.ConfigurationResponse;
import com.synbiohub.sbh3.dto.instance.CreateInstanceRequest;
import com.synbiohub.sbh3.dto.instance.InstanceResponse;
import com.synbiohub.sbh3.entities.Configurations;
import com.synbiohub.sbh3.entities.configentities.Instance;
import com.synbiohub.sbh3.security.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.factory.Mappers;

@Mapper
public interface InstanceMapper {
    InstanceMapper INSTANCE = Mappers.getMapper(InstanceMapper.class);

    @Mapping(source = "instanceName", target = "name")
    @Mapping(source = "color", target = "configuration.theme.baseColor")
    @Mapping(target = "configuration.theme.themeName", defaultValue = "default")
    @Mapping(source = "instanceURL", target = "instanceUri")
    @Mapping(source = "frontPageText", target = "description")
    @Mapping(target = "configuration.triplestore.defaultGraph", defaultValue = "http://virtuoso:8890/sparql")
    @Mapping(target = "configuration.triplestore.sparqlEndpoint", defaultValue = "http://virtuoso:8890/sparql")
    @Mapping(target = "configuration.triplestore.graphStoreEndpoint", defaultValue = "http://virtuoso:8890/sparql-graph-crud-auth/")
    @Mapping(target = "configuration.triplestore.graphPrefix", defaultValue = "https://synbiohub.org/")
    @Mapping(target = "configuration.triplestore.isql", defaultValue = "isql-vt")
    @Mapping(source = "virtuosoINI", target = "configuration.triplestore.virtuosoINI")
    @Mapping(source = "virtuosoDB", target = "configuration.triplestore.virtuosoDB")
    @Mapping(source = "allowPublicSignup", target = "configuration.allowPublicSignup")
    @Mapping(target = "configuration.port", defaultValue = "6789")
    Instance toInstanceEntity(CreateInstanceRequest request);

    @Mapping(source = "configuration.triplestore.virtuosoDB", target = "virtuosoDB")
    @Mapping(source = "name", target = "instanceName")
    InstanceResponse toInstanceResponse(Instance instance);

    @Mapping(source = "theme.baseColor", target = "color")
    @Mapping(source = "triplestore.virtuosoDB", target = "virtuosoDB")
    ConfigurationResponse toConfigurationResponse(Configurations configuration);

    @Mapping(source = "userName", target = "username")
    @Mapping(source = "userPassword", target = "password")
    @Mapping(source = "userFullName", target = "name")
    @Mapping(source = "userEmail", target = "email")
//    @Mapping(target = "isAdmin", defaultValue = "true")
//    @Mapping(target = "isCurator", defaultValue = "true")
    // TODO: set Role to Admin
    User toAdminUser(CreateInstanceRequest request);
}
