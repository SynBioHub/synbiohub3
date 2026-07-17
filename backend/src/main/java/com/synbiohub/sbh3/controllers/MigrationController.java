package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.services.MigrationService;
import com.synbiohub.sbh3.services.UserService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;

import java.nio.file.Files;
import java.nio.file.Path;

@Tag(name = "Migration", description = "Endpoints for migrating data from older SynBioHub versions")
@RestController
@AllArgsConstructor
public class MigrationController {

    private final UserService userService;
    private final MigrationService migrationService;

    @Operation(summary = "Migrate from older version", description = "Uploads old config files and user databases to migrate them into SynBioHub 3.")
    @ApiResponse(responseCode = "200", description = "Migration successful")
    @ApiResponse(responseCode = "500", description = "Internal server error during migration")
    @PostMapping(value = "/migration", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> handleFileUpload(
            @Parameter(description = "Old config.local.json file") @RequestParam("localjson") MultipartFile localConfigFile, 
            @Parameter(description = "Old config.json file") @RequestParam("configjson") MultipartFile configFile, 
            @Parameter(description = "Old users.sqlite database") @RequestParam("userfile") MultipartFile userFile) {

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
