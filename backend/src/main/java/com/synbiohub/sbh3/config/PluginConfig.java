package com.synbiohub.sbh3.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Getter
@Setter
public class PluginConfig {
    @Value("${plugin.external.testserver.login}")
    private String testServerLogin;

    @Value("${plugin.external.testserver.logout}")
    private String testServerLogout;

    @Value("${plugin.external.testserver.refresh}")
    private String testServerRefresh;

    @Value("${plugin.external.testserver.status}")
    private String testServerStatus;
}
