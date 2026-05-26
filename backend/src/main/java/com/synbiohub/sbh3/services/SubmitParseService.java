package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dto.submit.ParsedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitCreatedBy;
import com.synbiohub.sbh3.security.model.User;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;

/**
 * Submit pipeline step 1: parse multipart or url-encoded body into {@link ParsedSubmitPayload}
 * without trusting client-supplied identity; {@link SubmitCreatedBy} comes only from {@link User}.
 */
@Service
public class SubmitParseService {

    private static final Set<String> ALLOWED_OVERWRITE_MERGE = Set.of("0", "1", "2", "3");
    private static final String FILE_PART_PRIMARY = "file";
    private static final String FILE_PART_ALT = "files";

    public ParsedSubmitPayload parseMultipart(MultipartHttpServletRequest request, User user) throws IOException {
        Map<String, String[]> paramMap = request.getParameterMap();
        String id = first(paramMap, "id");
        String name = first(paramMap, "name");
        String description = first(paramMap, "description");
        String version = first(paramMap, "version");
        String citations = first(paramMap, "citations");
        String overwriteMerge = normalizeOverwriteMerge(first(paramMap, "overwriteMerge"));
        String plugin = resolvePlugin(paramMap);
        String collectionUri = first(paramMap, "collectionUri");
        if (collectionUri.isEmpty()) {
            collectionUri = first(paramMap, "collectionURI");
        }

        validateOverwriteMerge(overwriteMerge);

        String uploadedPath = null;
        MultipartFile file = resolveFilePart(request);
        if (file != null && !file.isEmpty()) {
            uploadedPath = streamToTempFile(file).toAbsolutePath().normalize().toString();
        }

        return ParsedSubmitPayload.builder()
                .id(id)
                .name(name)
                .description(description)
                .version(version)
                .citations(citations)
                .overwriteMerge(overwriteMerge)
                .plugin(plugin)
                .collectionUri(collectionUri.isEmpty() ? null : collectionUri)
                .uploadedFilePath(uploadedPath)
                .createdBy(SubmitCreatedBy.fromUser(user))
                .build();
    }

    public ParsedSubmitPayload parseUrlEncoded(HttpServletRequest request, User user) throws IOException {
        Map<String, String[]> paramMap = request.getParameterMap();
        String id = first(paramMap, "id");
        String name = first(paramMap, "name");
        String description = first(paramMap, "description");
        String version = first(paramMap, "version");
        String citations = first(paramMap, "citations");
        String overwriteMerge = normalizeOverwriteMerge(first(paramMap, "overwriteMerge"));
        String plugin = resolvePlugin(paramMap);
        String collectionUri = first(paramMap, "collectionUri");
        if (collectionUri.isEmpty()) {
            collectionUri = first(paramMap, "collectionURI");
        }

        validateOverwriteMerge(overwriteMerge);

        return ParsedSubmitPayload.builder()
                .id(id)
                .name(name)
                .description(description)
                .version(version)
                .citations(citations)
                .overwriteMerge(overwriteMerge)
                .plugin(plugin)
                .collectionUri(collectionUri.isEmpty() ? null : collectionUri)
                .uploadedFilePath(null)
                .createdBy(SubmitCreatedBy.fromUser(user))
                .build();
    }

    private static MultipartFile resolveFilePart(MultipartHttpServletRequest request) {
        MultipartFile f = request.getFile(FILE_PART_PRIMARY);
        if (f != null && !f.isEmpty()) {
            return f;
        }
        f = request.getFile(FILE_PART_ALT);
        if (f != null && !f.isEmpty()) {
            return f;
        }
        return null;
    }

    private static Path streamToTempFile(MultipartFile file) throws IOException {
        String original = file.getOriginalFilename();
        String suffix = "";
        if (original != null && original.contains(".")) {
            suffix = original.substring(original.lastIndexOf('.'));
            if (suffix.length() > 20) {
                suffix = "";
            }
        }
        Path target = Files.createTempFile("sbh-submit-", suffix.isEmpty() ? ".upload" : suffix);
        file.transferTo(target);
        return target;
    }

    private static String first(Map<String, String[]> paramMap, String key) {
        String[] v = paramMap.get(key);
        if (v == null || v.length == 0 || v[0] == null) {
            return "";
        }
        return v[0].trim();
    }

    private static String resolvePlugin(Map<String, String[]> paramMap) {
        String p = first(paramMap, "plugin");
        if (!p.isEmpty()) {
            return p;
        }
        return first(paramMap, "plugins");
    }

    private static String normalizeOverwriteMerge(String raw) {
        if (raw == null || raw.isEmpty()) {
            return "";
        }
        return raw.trim();
    }

    private static void validateOverwriteMerge(String overwriteMerge) {
        if (overwriteMerge.isEmpty()) {
            throw new IllegalArgumentException("overwriteMerge is required");
        }
        if (!ALLOWED_OVERWRITE_MERGE.contains(overwriteMerge)) {
            throw new IllegalArgumentException(
                    "overwriteMerge must be one of 0, 1, 2, 3; got: " + overwriteMerge);
        }
    }
}
