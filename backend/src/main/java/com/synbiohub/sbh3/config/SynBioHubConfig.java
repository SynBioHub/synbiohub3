package com.synbiohub.sbh3.config;


import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "synbiohub")
@Getter
@Setter
public class SynBioHubConfig {

    private boolean firstLaunch;
}
