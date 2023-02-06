package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dto.instance.MigrationInstanceRequest;
import com.synbiohub.sbh3.entities.Configurations;
import com.synbiohub.sbh3.entities.configentities.Instance;
import com.synbiohub.sbh3.entities.configentities.Theme;
import com.synbiohub.sbh3.entities.configentities.TripleStore;
import com.synbiohub.sbh3.repo.ConfigurationRepository;
import com.synbiohub.sbh3.repo.InstanceRepository;
import com.synbiohub.sbh3.repo.ThemeRepository;
import com.synbiohub.sbh3.repo.TripleStoreRepository;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.security.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MigrationService {

    private final UserService userService;
    private final InstanceService instanceService;
    private final InstanceRepository instanceRepository;
    private final ThemeRepository themeRepository;
    private final TripleStoreRepository tripleStoreRepository;
    private final ConfigurationRepository configurationRepository;
    private final UserRepository userRepository;
    public String migrate(Path localConfig, Path config, Path userList) throws IOException {
        Map<String,Object> localConfigMap =
                new ObjectMapper().readValue(localConfig.toFile(), HashMap.class);
        Map<String,Object> configMap =
                new ObjectMapper().readValue(config.toFile(), HashMap.class);
        Map<String, Object> finalConfig = new HashMap<>(configMap);
        finalConfig.putAll(localConfigMap);
        Set<User> users = userService.connect(userList.toAbsolutePath().toString());
        userRepository.saveAll(users);
        Map<String, Object> tripleStoreMap = (Map) finalConfig.get("triplestore");
        TripleStore tripleStore = TripleStore.builder()
                .defaultGraph(tripleStoreMap.get("defaultGraph").toString())
                .graphPrefix(tripleStoreMap.get("graphPrefix").toString())
                .graphStoreEndpoint(tripleStoreMap.get("graphStoreEndpoint").toString())
                .username(tripleStoreMap.get("username").toString())
                .password(tripleStoreMap.get("password").toString())
                .isql(tripleStoreMap.get("isql").toString())
                .sparqlEndpoint(tripleStoreMap.get("sparqlEndpoint").toString())
                .virtuosoDB(tripleStoreMap.get("virtuosoDB").toString())
                .virtuosoINI(tripleStoreMap.get("virtuosoINI").toString())
                .build();
        tripleStoreRepository.save(tripleStore);
        Instance instance = Instance.builder()
                .name(finalConfig.get("instanceName").toString())
                .description(finalConfig.get("frontPageText").toString())
                .instanceUri(finalConfig.get("instanceUrl").toString())
                .build();
        instanceRepository.save(instance);
        String themeName = finalConfig.get("theme").toString();
        Map<String, Object> themeMap = (Map)((Map) finalConfig.get("themeParameters")).get(themeName);
        Theme theme = Theme.builder()
                .themeName(themeName)
                .baseColor(themeMap.get("baseColor").toString())
                .build();
        themeRepository.save(theme);
        Configurations configuration = Configurations.builder()
                .triplestore(tripleStore)
                .port(Integer.parseInt(finalConfig.get("port").toString()))
                .instance(instance)
                .theme(theme)
                .allowPublicSignup(Boolean.getBoolean(finalConfig.get("allowPublicSignup").toString()))
                .users(users)
                .build();
        configurationRepository.save(configuration);
        return "working";
    }
}
