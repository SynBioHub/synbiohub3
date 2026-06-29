package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.zip.GZIPOutputStream;

/**
 * Content-addressed gzip upload storage (legacy {@code uploads.js#createUpload}).
 */
@Service
public class SubmitUploadStorageService {

    @Value
    public static class UploadInfo {
        String hash;
        long size;
        String mime;
    }

    public UploadInfo createUploadFromFile(Path file) throws IOException {
        MessageDigest digest;
        try {
            digest = MessageDigest.getInstance("SHA-1");
        } catch (Exception e) {
            throw new IOException("SHA-1 not available", e);
        }
        Path temp = Files.createTempFile("sbh-upload-", ".gz");
        long size;
        try {
            try (InputStream in = Files.newInputStream(file);
                 DigestInputStream din = new DigestInputStream(in, digest);
                 OutputStream gzip = new GZIPOutputStream(Files.newOutputStream(temp))) {
                size = din.transferTo(gzip);
            }
            String hash = HexFormat.of().formatHex(digest.digest());
            Path dest = uploadPath(hash);
            if (Files.exists(dest)) {
                Files.deleteIfExists(temp);
            } else {
                Files.createDirectories(dest.getParent());
                Files.move(temp, dest);
            }
            return new UploadInfo(hash, size, guessMime(file));
        } finally {
            Files.deleteIfExists(temp);
        }
    }

    private static Path uploadPath(String hash) {
        String prefix = hash.substring(0, 2);
        String rest = hash.substring(2);
        return Path.of("uploads", prefix, rest + ".gz");
    }

    private static String guessMime(Path file) throws IOException {
        String name = file.getFileName().toString();
        int dot = name.lastIndexOf('.');
        if (dot > 0) {
            String ext = name.substring(dot + 1);
            var map = ConfigUtil.get("fileExtensionToAttachmentType");
            if (map != null && map.has(ext)) {
                return map.get(ext).asText();
            }
        }
        String probed = Files.probeContentType(file);
        if (probed != null && !probed.isBlank()) {
            return "http://purl.org/NET/mediatypes/" + probed;
        }
        return "http://purl.org/NET/mediatypes/text/plain";
    }
}
