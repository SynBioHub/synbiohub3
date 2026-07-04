package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.submit.SubmitExposeRegistry;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLConnection;
import java.nio.file.Files;
import java.nio.file.Path;

@RestController
@RequiredArgsConstructor
public class ExposeController {

    private final SubmitExposeRegistry exposeRegistry;

    @GetMapping("/expose/{token}")
    public ResponseEntity<Resource> exposeFile(@PathVariable String token) {
        Path file = exposeRegistry.resolve(token);
        if (file == null || !Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }
        String filename = file.getFileName().toString();
        String contentType = URLConnection.guessContentTypeFromName(filename);
        MediaType mediaType = contentType != null
                ? MediaType.parseMediaType(contentType)
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(new FileSystemResource(file));
    }
}
