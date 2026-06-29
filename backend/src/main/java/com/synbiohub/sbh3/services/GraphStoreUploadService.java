package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.VirtuosoDigestRestTemplate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

/**
 * Upload prepared SBOL RDF to a Virtuoso named graph (legacy {@code sparql.uploadFile}).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GraphStoreUploadService {

    private final VirtuosoDigestRestTemplate virtuosoHttp;

    public void uploadRdfFile(String graphUri, String filename, String contentType) throws IOException, InterruptedException {
        Path rdf = Path.of(filename);
        if (!Files.isRegularFile(rdf)) {
            throw new IOException("RDF file not found: " + filename);
        }
        Path workDir = Files.createTempDirectory("sbh-n3-split-");
        try {
            if (trySplitToN3(rdf, workDir)) {
                try (Stream<Path> chunks = Files.list(workDir)
                        .filter(p -> p.getFileName().toString().startsWith("upload_"))
                        .sorted(Comparator.comparing(p -> p.getFileName().toString()))) {
                    List<Path> files = chunks.toList();
                    log.info("Uploading {} N3 chunk(s) to graph {}", files.size(), graphUri);
                    for (Path chunk : files) {
                        uploadBytes(graphUri, Files.readAllBytes(chunk), "text/n3");
                        Files.deleteIfExists(chunk);
                    }
                }
            } else {
                log.info("Uploading whole RDF file to graph {} (no rapper split)", graphUri);
                uploadBytes(graphUri, Files.readAllBytes(rdf), contentType);
            }
        } finally {
            deleteRecursively(workDir);
        }
    }

    private boolean trySplitToN3(Path rdfFile, Path workDir) throws IOException, InterruptedException {
        Path script = Path.of("scripts/split_to_n3.sh").toAbsolutePath().normalize();
        if (!Files.isRegularFile(script)) {
            return false;
        }
        ProcessBuilder pb = new ProcessBuilder("bash", script.toString(), rdfFile.toAbsolutePath().toString());
        pb.directory(workDir.toFile());
        pb.redirectErrorStream(true);
        Process p = pb.start();
        String out = new String(p.getInputStream().readAllBytes());
        int code = p.waitFor();
        if (code != 0) {
            log.warn("split_to_n3 failed (exit {}): {}", code, out);
            return false;
        }
        try (Stream<Path> s = Files.list(workDir)) {
            return s.anyMatch(path -> path.getFileName().toString().startsWith("upload_"));
        }
    }

    private void uploadBytes(String graphUri, byte[] body, String contentType) throws IOException {
        String endpoint = ConfigUtil.get("graphStoreEndpoint").asText().trim();
        String url = endpoint + "?graph-uri={graph}";
        Map<String, String> params = new HashMap<>();
        params.put("graph", graphUri);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        HttpEntity<byte[]> entity = new HttpEntity<>(body, headers);
        ResponseEntity<String> res = virtuosoHttp.get().exchange(url, HttpMethod.POST, entity, String.class, params);
        if (!res.getStatusCode().is2xxSuccessful()) {
            throw new IOException("Graph store upload failed: " + res.getStatusCode() + " " + res.getBody());
        }
    }

    private static void deleteRecursively(Path dir) throws IOException {
        if (!Files.exists(dir)) {
            return;
        }
        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(p -> {
                try {
                    Files.deleteIfExists(p);
                } catch (IOException ignored) {
                }
            });
        }
    }
}
