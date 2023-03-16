package com.synbiohub.sbh3.utils;

import com.fasterxml.jackson.core.exc.StreamReadException;
import com.fasterxml.jackson.databind.DatabindException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

@Slf4j
@Component
public class ConfigUtil {

    private static JsonNode json;
    private static ObjectMapper mapper = new ObjectMapper();

    public ConfigUtil() {
        json = null;
//        try {
//            // Initialize config.local.dup.json
//            if (!Files.exists(new File("data/config.local.dup.json").toPath())) {
//                Files.copy(new File("src/main/resources/config.json").toPath(), new File("data/config.local.dup.json").toPath());
//                json = mapper.readValue(new File("data/config.local.dup.json"), JsonNode.class);
//            } else
//                json = mapper.readValue(new File("data/config.local.dup.json"), JsonNode.class);
//
//        } catch (Exception e) {
//            log.error("Error intializing config file!");
//        }
        try {
            json = mapper.readValue(new File("data/config.local.json"), JsonNode.class);
        } catch (Exception e) {
            log.error("Error initializing config file!");
        }
    }

    public static JsonNode get(String key) {
        if (key.isEmpty())
            return json;
        try {
            var item = json.get(key);
            if (item != null && !item.isNull()) {
                return item;
            } else {
                // Go to regular config if item not in local
                json = mapper.readValue(new File("src/main/resources/config.json"), JsonNode.class);
                return json.get(key);
            }
        } catch (Exception e) {
            log.error("Error initializing config file!");
        }
        return null;
    }

    // TODO : Add set method

    // if key does not exist, this method creates a new key-value pair in config file
    // if key does exist, it just replaces the value of existing key
    // may still need a set method for individual param, but that may be very difficult since a lot of the JSON is nested
    public void setLocalConfig(Map<String, String> params) {
        try {
            String jsonString = "";
            Path path = Paths.get("/data/config.local.dup.json");
            ObjectNode js = (ObjectNode) mapper.createObjectNode();
            Gson gson = new Gson();

            JsonNode oldConfig = mapper.readValue(new File("src/main/resources/config.json"), JsonNode.class);
            js.put("firstLaunch", "false");

            // Params that the user should be inputting in with setup
            if (params.containsKey("instanceName")) {
                js.put("instanceName", params.get("instanceName"));
            } else {
                js.set("instanceName", oldConfig.get("instanceName"));
            }
            if (params.containsKey("userName")) {
                js.put("userName", params.get("userName"));
            } else {
                js.set("userName", oldConfig.get("userName"));
            }
            if (params.containsKey("userFullName")) {
                js.put("userFullName", params.get("userFullName"));
            } else {
                js.set("userFullName", oldConfig.get("userFullName"));
            }
            if (params.containsKey("userEmail")) {
                js.put("userEmail", params.get("userEmail"));
            } else {
                js.set("userEmail", oldConfig.get("userEmail"));
            }
            if (params.containsKey("instanceURL")) {
                js.put("instanceURL", params.get("instanceURL"));
            } else {
                js.set("instanceURL", oldConfig.get("instanceURL"));
            }
            if (params.containsKey("uriPrefix")) {
                js.put("uriPrefix", params.get("uriPrefix"));
            } else {
                js.set("uriPrefix", oldConfig.get("uriPrefix"));
            }
            if (params.containsKey("frontPageText")) {
                js.put("frontPageText", params.get("frontPageText"));
            } else {
                js.set("frontPageText", oldConfig.get("frontPageText"));
            }
            if (params.containsKey("virtuosoINI")) {
                js.put("virtuosoINI", params.get("virtuosoINI"));
            } else {
                js.set("virtuosoINI", oldConfig.get("virtuosoINI"));
            }
            if (params.containsKey("virtuosoDB")) {
                js.put("virtuosoDB", params.get("virtuosoDB"));
            } else {
                js.set("virtuosoDB", oldConfig.get("virtuosoDB"));
            }
            if (params.containsKey("affiliation")) {
                js.put("affiliation", params.get("affiliation"));
            } else {
                js.set("affiliation", oldConfig.get("affiliation"));
            }
            if (params.containsKey("color")) {
                js.put("color", params.get("color"));
            } else {
                js.set("color", oldConfig.get("color"));
            }


            //Params that are not in current user setup, but can be changed later. Being copied over from config.json
            js.set("instanceLogo", oldConfig.get("instanceLogo"));
            js.set("keywords", oldConfig.get("keywords"));
            js.set("javaPath", oldConfig.get("javaPath"));
            js.set("theme", oldConfig.get("theme"));
            js.set("themeParameters", oldConfig.get("themeParameters"));
            js.set("webOfRegistriesUrl", oldConfig.get("webOfRegistriesUrl"));
            js.set("port", oldConfig.get("port"));
            js.set("triplestore", oldConfig.get("triplestore"));
            js.set("SBOLExplorerEndpoint", oldConfig.get("SBOLExplorerEndpoint"));
            js.set("useSBOLExplorer", oldConfig.get("useSBOLExplorer"));
            js.set("databasePrefix", oldConfig.get("databasePrefix"));
            js.set("sessionSecret", oldConfig.get("sessionSecret"));
            js.set("shareLinkSalt", oldConfig.get("shareLinkSalt"));
            js.set("passwordSalt", oldConfig.get("passwordSalt"));
            js.set("requireCompliant", oldConfig.get("requireCompliant"));
            js.set("requireComplete", oldConfig.get("requireComplete"));
            js.set("requireBestPractice", oldConfig.get("requireBestPractice"));
            js.set("removePublicEnabled", oldConfig.get("removePublicEnabled"));
            js.set("namespaces", oldConfig.get("namespaces"));
            js.set("webOfRegistries", oldConfig.get("webOfRegistries"));
            js.set("uploadLimit", oldConfig.get("uploadLimit"));
            js.set("resolveBatch", oldConfig.get("resolveBatch"));
            js.set("fetchLimit", oldConfig.get("fetchLimit"));
            js.set("staggeredQueryLimit", oldConfig.get("staggeredQueryLimit"));
            js.set("mail", oldConfig.get("mail"));
            js.set("collectionIcons", oldConfig.get("collectionIcons"));
            js.set("experimental", oldConfig.get("experimental"));
            js.set("fileExtensionToAttachmentType", oldConfig.get("fileExtensionToAttachmentType"));
            js.set("attachmentTypeToMimeType", oldConfig.get("attachmentTypeToMimeType"));
            js.set("attachmentTypeToTypeName", oldConfig.get("attachmentTypeToTypeName"));
            js.set("iceMaxRetries", oldConfig.get("iceMaxRetries"));
            js.set("iceRetryDelay", oldConfig.get("iceRetryDelay"));
            js.set("remotes", oldConfig.get("remotes"));
            js.set("defaultLimit", oldConfig.get("defaultLimit"));
            js.set("allowPublicSignup", oldConfig.get("allowPublicSignup"));
            js.set("showModuleInteractions", oldConfig.get("showModuleInteractions"));
            js.set("prewarmSearch", oldConfig.get("prewarmSearch"));
            js.set("bioschemas", oldConfig.get("bioschemas"));
            js.set("plugins", oldConfig.get("plugins"));

            Files.write(path, js.toPrettyString().getBytes());
        } catch (Exception e) {
            throw new RuntimeException("Error while setting up new local config file.");
        }

    }


    public Boolean isLaunched() {
        return json.get("firstLaunch").asBoolean();
    }
}
