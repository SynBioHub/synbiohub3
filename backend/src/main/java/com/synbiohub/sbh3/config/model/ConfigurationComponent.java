package com.synbiohub.sbh3.config.model;

import com.synbiohub.sbh3.config.repo.CustomConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.List;

@Component
public class ConfigurationComponent {

    private final CustomConfigurationRepository configurationRepository;

    private List<CustomConfiguration> configurations;

    public ConfigurationComponent(CustomConfigurationRepository configurationRepository) {
        this.configurationRepository = configurationRepository;
        configurations = configurationRepository.findAll();
    }

    public List<CustomConfiguration> getConfigurations() {
        return configurations;
    }
}
