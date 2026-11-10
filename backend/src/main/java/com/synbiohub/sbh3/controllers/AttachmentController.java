package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.services.AttachmentService;
import com.synbiohub.sbh3.services.DownloadService;
import com.synbiohub.sbh3.security.customsecurity.ServletPathUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Attachments", description = "Endpoints for managing file attachments and URLs")
@RestController
@RequiredArgsConstructor
@Slf4j
public class AttachmentController {
    private final AttachmentService attachmentService;
    private final DownloadService downloadService;

    @Operation(summary = "Remove attachment", description = "Removes an attachment from an object owned by the authenticated user.")
    @PreAuthorize("hasAnyAuthority('USER', 'CURATOR', 'ADMIN')")
    @DeleteMapping("/attachments")
    public ResponseEntity<Void> removeAttachment(@RequestParam String uri,
                                                  @RequestParam String attachment) throws IOException {
        attachmentService.removeAttachment(uri, attachment);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<String> handleRequestError(org.springframework.web.server.ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(error.getReason());
    }

    @Operation(summary = "Attach file", description = "Stores a file and attaches it to an object owned by the authenticated user.")
    @PreAuthorize("hasAnyAuthority('USER', 'CURATOR', 'ADMIN')")
    @PostMapping(value = "/attach", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> attach(@RequestParam String uri, @RequestPart("file") MultipartFile file) throws IOException {
        attachmentService.attachFile(uri, file);
        return ResponseEntity.ok("Successfully attached");
    }

    @PreAuthorize("hasAnyAuthority('USER', 'CURATOR', 'ADMIN')")
    @PostMapping(value = {
            "/user/{username}/{collectionId}/{displayId}/{version}/attach",
            "/public/{collectionId}/{displayId}/{version}/attach"
    }, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> attachToObject(HttpServletRequest request,
                                                @RequestPart("file") MultipartFile file) throws IOException {
        String path = ServletPathUtil.getPathWithinApplication(request);
        String targetPath = path.substring(0, path.length() - "/attach".length());
        String uri = targetPath.startsWith("/user/")
                ? downloadService.userObjectUriFromServletPath(targetPath)
                : downloadService.publicObjectUriFromServletPath(targetPath);
        return attach(uri, file);
    }

    @Operation(summary = "Attach URL (Unimplemented)", description = "Attaches a remote URL. Currently an empty stub.", deprecated = true)
    @PostMapping(value = "/attachURL")
    public ResponseEntity<String> attachURL(@Parameter(description = "Parameters for attaching the URL") @RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @Operation(summary = "Download attachment (Unimplemented)", description = "Returns the source for an attachment to the specified URI. Currently an empty stub.", deprecated = true)
    @GetMapping(value = "/download") 
    public String download() {
        return null;
    }

    @GetMapping(value = {
            "/user/{username}/{collectionId}/{displayId}/{version}/download",
            "/public/{collectionId}/{displayId}/{version}/download"
    })
    public ResponseEntity<byte[]> downloadAttachment(HttpServletRequest request) throws IOException {
        String path = ServletPathUtil.getPathWithinApplication(request);
        String objectPath = path.substring(0, path.length() - "/download".length());
        String uri = objectPath.startsWith("/user/")
                ? downloadService.userObjectUriFromServletPath(objectPath)
                : downloadService.publicObjectUriFromServletPath(objectPath);
        var download = attachmentService.downloadFile(uri);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(download.filename()).build().toString())
                .header("X-Content-Type-Options", "nosniff")
                .contentLength(download.content().length)
                .body(download.content());
    }
}
