package com.synbiohub.sbh3.security.customsecurity;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
@ConfigurationProperties
public class EndpointProperties {
    private Map<String, List<String>> roleToEndpointPermissions;

    public List<String> getRoleToEndpointPermissions(String role) {
        return roleToEndpointPermissions.get(role);
    }

    public void setRoleToEndpointPermissions(Map<String, List<String>> roleToEndpointPermissions) {
        this.roleToEndpointPermissions = roleToEndpointPermissions;
    }
}


