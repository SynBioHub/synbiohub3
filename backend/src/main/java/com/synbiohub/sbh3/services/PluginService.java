package com.synbiohub.sbh3.services;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


import java.io.File;
import java.net.URLConnection;
import java.util.List;

@Service
@NoArgsConstructor
public class PluginService {


        public String getURL(String name) throws NullPointerException{ // Function to find a plugin by name or URL from the config.json file
            JsonNode plugins = ConfigUtil.get("plugins");
            JsonNode target = null;

            for(JsonNode category: plugins) {
                for (JsonNode instance : category) {
                    if (name.equals(instance.get("name").textValue()) || name.equals(instance.get("url").textValue())) {
                        target = instance;
                        break;
                    }
                }
            }

            return target.get("url").textValue(); //Returns the URL of the plugin
            //Redundant if the URL was given, but a way to standardize without other checks
        }

        public String getCategory(String name) {
            JsonNode plugins = ConfigUtil.get("plugins");

            JsonNode category = plugins.get("submit");

            for (JsonNode instance : category) {
                if (name.equals(instance.get("name").textValue()) || name.equals(instance.get("url").textValue())) {
                    return "submit";
                }
            }

            category = plugins.get("rendering");

            for (JsonNode instance : category) {
                if (name.equals(instance.get("name").textValue()) || name.equals(instance.get("url").textValue())) {
                    return "visual";
                }
            }

            return "download";
        }
        
}
