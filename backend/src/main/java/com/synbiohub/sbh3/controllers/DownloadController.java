package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.services.DownloadService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.io.ByteArrayInputStream;

@RestController
@RequiredArgsConstructor
public class DownloadController {

    private final DownloadService downloadService;

    private final ObjectMapper mapper;

    @GetMapping(value = "**/metadata")
    public ResponseEntity<?> getMetadata(HttpServletRequest request) throws JsonProcessingException {
        var uri = request.getRequestURL().toString();
        String splitUri = uri.split("/metadata")[0];
        String results = downloadService.getMetadata(splitUri);
        byte[] buf = mapper.writeValueAsBytes(mapper.readTree(results));

        var uriArr = uri.split("/");
        return ResponseEntity
                .ok()
                .contentLength(buf.length)
                .contentType(
                        MediaType.parseMediaType("application/octet-stream"))
                .header("Content-Disposition", "attachment; filename=\"" + uriArr[uriArr.length-3] + ".json\"")
                .body(new InputStreamResource(new ByteArrayInputStream(buf)));
    }
}
