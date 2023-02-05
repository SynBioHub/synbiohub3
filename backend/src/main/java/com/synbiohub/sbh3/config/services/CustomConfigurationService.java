package com.synbiohub.sbh3.config.services;


import com.synbiohub.sbh3.config.model.CustomConfiguration;
import com.synbiohub.sbh3.config.repo.CustomConfigurationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CustomConfigurationService {

    @Autowired
    private CustomConfigurationRepository configurationRepository;

    public String saveConfigurations(Path localFilePath, Path configFilePath) throws IOException {
        String localContent = Files.readString(localFilePath);
        String configContent = Files.readString(configFilePath);
        CustomConfiguration localConfig = new CustomConfiguration(1L,1L, localContent, "local");
        CustomConfiguration config = new CustomConfiguration(2L,1L, configContent, "config");
        configurationRepository.save(localConfig);
        configurationRepository.save(config);
        return "saved.";
    }
}
