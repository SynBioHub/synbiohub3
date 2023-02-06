package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.services.MigrationService;
import com.synbiohub.sbh3.services.UserService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@AllArgsConstructor
public class MigrationController {

    private final UserService userService;
    private final MigrationService migrationService;

    @PostMapping("/migration")
    public ResponseEntity<?> handleFileUpload(@RequestParam("localjson") MultipartFile localConfigFile, @RequestParam("configjson") MultipartFile configFile, @RequestParam("userfile") MultipartFile userFile) {

        String localConfigFileDest;
        String configFileDest;
        String userFileDest;
        try {
            Path localPath = Files.createTempFile("local.config", ".json");
            Path configPath = Files.createTempFile("config", ".json");
            Path userPath = Files.createTempFile("user", ".sqlite");
            localConfigFileDest = localPath.toAbsolutePath().toString();
            configFileDest = configPath.toAbsolutePath().toString();
            userFileDest = userPath.toAbsolutePath().toString();
            localConfigFile.transferTo(localPath);
            configFile.transferTo(configPath);
            userFile.transferTo(userPath);
            migrationService.migrate(localPath, configPath, userPath);
//            configurationService.saveConfigurations(localPath, configPath);
//            userService.connect(userFileDest);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }

        return ResponseEntity.ok("File uploaded successfully to " + localConfigFileDest + " and " + configFileDest + " and " + userFileDest);
    }
}
