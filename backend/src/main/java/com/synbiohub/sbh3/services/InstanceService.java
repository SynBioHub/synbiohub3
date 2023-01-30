package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dto.configuration.ConfigurationResponse;
import com.synbiohub.sbh3.dto.configuration.GetConfigurationRequest;
import com.synbiohub.sbh3.dto.configuration.UpdateConfigurationRequest;
import com.synbiohub.sbh3.dto.instance.CreateInstanceRequest;
import com.synbiohub.sbh3.dto.instance.InstanceResponse;
import com.synbiohub.sbh3.dto.instance.UpdateInstanceRequest;
import com.synbiohub.sbh3.entities.Configurations;
import com.synbiohub.sbh3.entities.configentities.Instance;
import com.synbiohub.sbh3.mapper.InstanceMapper;
import com.synbiohub.sbh3.repo.ConfigurationRepository;
import com.synbiohub.sbh3.repo.InstanceRepository;
import com.synbiohub.sbh3.repo.ThemeRepository;
import com.synbiohub.sbh3.repo.TripleStoreRepository;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.security.repo.UserRepository;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@AllArgsConstructor
public class InstanceService {

    private final InstanceRepository instanceRepository;
    private final ConfigurationRepository configurationRepository;
    private final ThemeRepository themeRepository;
    private final TripleStoreRepository tripleStoreRepository;
    private final UserRepository userRepository;

    @Transactional
    public InstanceResponse create(CreateInstanceRequest request) {
        Instance instance = InstanceMapper.INSTANCE.toInstanceEntity(request);
        User newAdminUser = InstanceMapper.INSTANCE.toAdminUser(request);
        instance.getConfiguration().setUsers(Set.of(newAdminUser));
        userRepository.save(newAdminUser);
        themeRepository.save(instance.getConfiguration().getTheme());
        tripleStoreRepository.save(instance.getConfiguration().getTriplestore());
        instanceRepository.save(instance);
        instance.getConfiguration().setInstance(instance);
        configurationRepository.save(instance.getConfiguration());
        return InstanceMapper.INSTANCE.toInstanceResponse(instance);
    }

    public InstanceResponse update(UpdateInstanceRequest request, Long instanceId) {
        Configurations configuration = instanceRepository.findById(instanceId)
                .map(Instance::getConfiguration)
                .map(config -> {
                    config.getInstance().setInstanceUri(request.getInstanceURL());
                    config.getInstance().setName(request.getInstanceName());
                    config.getInstance().setDescription(request.getFrontPageText());
                    config.getTriplestore().setVirtuosoINI(request.getVirtuosoINI());
                    config.getTriplestore().setVirtuosoDB(request.getVirtuosoDB());
                    config.getTheme().setBaseColor(request.getColor());
                    return config;
                }).orElseThrow(() -> new RuntimeException("Cannot find configuration. " + instanceId));
        instanceRepository.save(configuration.getInstance());
        tripleStoreRepository.save(configuration.getTriplestore());
        themeRepository.save(configuration.getTheme());
        userRepository.saveAll(configuration.getUsers());
        configurationRepository.save(configuration);
        return InstanceMapper.INSTANCE.toInstanceResponse(configuration.getInstance());
    }

    public ConfigurationResponse updateConfigurations(UpdateConfigurationRequest request, Long instanceId, Long configurationId) {
        Configurations configuration = configurationRepository.findById(configurationId)
                .map(config -> {
                    config.getInstance().setDescription(request.getFrontPageText());
                    config.getTriplestore().setVirtuosoINI(request.getVirtuosoINI());
                    config.getTriplestore().setVirtuosoDB(request.getVirtuosoDB());
                    config.getTheme().setBaseColor(request.getColor());
                    return config;
                }).orElseThrow(() -> new RuntimeException("Cannot find configuration. " + instanceId));
        tripleStoreRepository.save(configuration.getTriplestore());
        themeRepository.save(configuration.getTheme());
        userRepository.saveAll(configuration.getUsers());
        configurationRepository.save(configuration);
        return InstanceMapper.INSTANCE.toConfigurationResponse(configuration);
    }

    public ConfigurationResponse getConfiguration(GetConfigurationRequest request, Long instanceId, Long configurationId) {
//        Configurations configuration = configurationRepository.findById(configurationId)
//                .map(config -> {
//                    String target = request.getColor()
//                });
        return null;
    }

}
