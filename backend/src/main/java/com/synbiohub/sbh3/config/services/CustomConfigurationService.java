package com.synbiohub.sbh3.config.services;


import com.synbiohub.sbh3.config.model.CustomConfiguration;
import com.synbiohub.sbh3.config.repo.CustomConfigurationRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CustomConfigurationService {

    @Autowired
    private CustomConfigurationRepository configurationRepository;

    public List<CustomConfiguration> findAll() {
        return configurationRepository.findAll();
    }

    public void save(String key, String value) {
        configurationRepository.save(new CustomConfiguration(key, value));
    }

    public void save(Map<String, String> configParams) {
        configurationRepository.saveAll(configParams.entrySet().stream()
                .map(e -> new CustomConfiguration(e.getKey(),e.getValue()))
                .collect(Collectors.toList()));
    }

    public Boolean isLaunched() {
        return configurationRepository.findById("firstLaunch")
                .map(CustomConfiguration::getValue)
                .map(v -> v.equals("false"))
                .orElse(false);
    }
}
