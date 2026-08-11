package com.synbiohub.sbh3.submit;

import com.synbiohub.sbh3.utils.ConfigUtil;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Single-use URLs under {@code /expose/{token}} so submit plugins can fetch uploaded files.
 */
@Component
public class SubmitExposeRegistry {

    private final Map<String, Path> exposed = new ConcurrentHashMap<>();

    public String register(Path file) throws IOException {
        String token = UUID.randomUUID().toString();
        exposed.put(token, file.toAbsolutePath());
        String base = ConfigUtil.get("instanceUrl").asText();
        if (!base.endsWith("/")) {
            base = base + "/";
        }
        return base + "expose/" + token;
    }

    public Path resolve(String token) {
        return exposed.get(token);
    }

    public void revoke(String token) {
        exposed.remove(token);
    }
}
