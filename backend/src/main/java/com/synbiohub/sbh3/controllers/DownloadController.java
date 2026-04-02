package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.services.DownloadService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.SBOLDocument;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;

@RestController
@RequiredArgsConstructor
@Slf4j
public class DownloadController extends AntPathMatcher {

    private static final MediaType SBOL_RDF_XML = MediaType.parseMediaType("application/rdf+xml");

    private final DownloadService downloadService;

    private final ObjectMapper mapper;

    /**
     * Legacy: GET /public/{db}/{id}/{ver}/sbol — SBOL2 RDF/XML (recursive closure). Same for /user/{username}/...
     */
    @GetMapping(value = { "/public/{db}/{id}/{ver}/sbol", "/user/{username}/{db}/{id}/{ver}/sbol" })
    public ResponseEntity<?> getSbolVersioned(
            @PathVariable(required = false) String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        String topUri = (username != null && !username.isBlank())
                ? downloadService.userVersionedObjectUri(username, db, id, ver)
                : downloadService.publicVersionedObjectUri(db, id, ver);
        return sbolXmlResponse(topUri, id);
    }

    /**
     * Legacy persistent-identity URL: /public/{db}/{id}/sbol (no version); resolves latest version via SPARQL.
     */
    @GetMapping(value = { "/public/{db}/{id}/sbol", "/user/{username}/{db}/{id}/sbol" })
    public ResponseEntity<?> getSbolPersistentIdentity(
            @PathVariable(required = false) String username,
            @PathVariable String db,
            @PathVariable String id) throws IOException {
        String persistent = (username != null && !username.isBlank())
                ? downloadService.userPersistentIdentityUri(username, db, id)
                : downloadService.publicPersistentIdentityUri(db, id);
        String topUri = downloadService.resolveLatestVersionedUri(persistent);
        if (topUri == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("uri not found");
        }
        return sbolXmlResponse(topUri, id);
    }

    /**
     * Same SBOL document as /sbol but without the {@code /sbol} path suffix (legacy alternate URL).
     */
    @GetMapping(value = { "/public/{db}/{id}/{ver}", "/user/{username}/{db}/{id}/{ver}" })
    public ResponseEntity<?> getSbolRecursiveRDF(
            @PathVariable(required = false) String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        String topUri = (username != null && !username.isBlank())
                ? downloadService.userVersionedObjectUri(username, db, id, ver)
                : downloadService.publicVersionedObjectUri(db, id, ver);
        return sbolXmlResponse(topUri, id);
    }

    private ResponseEntity<?> sbolXmlResponse(String topLevelUri, String displayIdForFilename) throws IOException {
        byte[] bytes = downloadService.getSbol2RdfXmlBytes(topLevelUri);
        if (bytes == null || bytes.length == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("uri not found");
        }
        return ResponseEntity.ok()
                .contentType(SBOL_RDF_XML)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + displayIdForFilename + ".xml\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(new InputStreamResource(new ByteArrayInputStream(bytes)));
    }

    @GetMapping(value = { "/public/{db}/{id}/{ver}/sbolnr", "/user/{username}/{db}/{id}/{ver}/sbolnr" })
    public ResponseEntity<?> getSBOLNonRecursive(
            @PathVariable(required = false) String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        String topUri = (username != null && !username.isBlank())
                ? downloadService.userVersionedObjectUri(username, db, id, ver)
                : downloadService.publicVersionedObjectUri(db, id, ver);
        byte[] body = downloadService.getSBOLNonRecursiveRdfXmlBytes(topUri);

        return ResponseEntity
                .ok()
                .contentType(SBOL_RDF_XML)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + ".xml\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(new InputStreamResource(new ByteArrayInputStream(body)));
    }

    @GetMapping(value = "/public/{db}/{id}/{ver}/metadata")
    public ResponseEntity<?> getMetadata(@PathVariable String db, @PathVariable String id, @PathVariable String ver) throws IOException {
        String splitUri = ConfigUtil.get("defaultGraph").toString().replace("\"","") + "/" + db + "/" + id + "/" + ver;
        String uri = splitUri + "/metadata";
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

    @GetMapping(value = { "/public/{db}/{id}/{ver}/gb", "/user/{username}/{db}/{id}/{ver}/gb" })
    public ResponseEntity<?> getSBOLRecursiveGenbank(
            @PathVariable(required = false) String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        String topUri = (username != null && !username.isBlank())
                ? downloadService.userVersionedObjectUri(username, db, id, ver)
                : downloadService.publicVersionedObjectUri(db, id, ver);

        var sbolDocument = downloadService.getSBOLRecursive(topUri);
        var byteOutput = new ByteArrayOutputStream();
        try {
            sbolDocument.write(byteOutput, SBOLDocument.GENBANK);
        } catch (Exception e) {
            log.error("Error writing SBOL to byte array!");
        }

        return ResponseEntity
                .ok()
                .contentType(MediaType.parseMediaType("application/xml"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + ".gb\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(new InputStreamResource(new ByteArrayInputStream(byteOutput.toByteArray())));
    }

    @GetMapping(value = { "/public/{db}/{id}/{ver}/fasta", "/user/{username}/{db}/{id}/{ver}/fasta" })
    public ResponseEntity<?> getLegacyFasta(
            @PathVariable(required = false) String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        String topUri = (username != null && !username.isBlank())
                ? downloadService.userVersionedObjectUri(username, db, id, ver)
                : downloadService.publicVersionedObjectUri(db, id, ver);

        var doc = downloadService.getSBOLRecursive(topUri);
        String fasta = downloadService.buildLegacyFastaForTopLevel(doc, topUri, id);
        if (fasta == null || fasta.isBlank()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("No sequences found");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + ".fasta\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(fasta);
    }

    @GetMapping(value = { "/public/{db}/{id}/{ver}/gff", "/user/{username}/{db}/{id}/{ver}/gff" })
    public ResponseEntity<?> getSBOLRecursiveGff3(
            @PathVariable(required = false) String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        String topUri = (username != null && !username.isBlank())
                ? downloadService.userVersionedObjectUri(username, db, id, ver)
                : downloadService.publicVersionedObjectUri(db, id, ver);

        var sbolDocument = downloadService.getSBOLRecursive(topUri);
        var byteOutput = new ByteArrayOutputStream();
        try {
            sbolDocument.write(byteOutput, SBOLDocument.GFF3format);
        } catch (Exception e) {
            log.error("Error writing SBOL to byte array!");
        }

        return ResponseEntity
                .ok()
                .contentType(MediaType.parseMediaType("application/xml"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + ".gff\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(new InputStreamResource(new ByteArrayInputStream(byteOutput.toByteArray())));
    }

    // /download endpoint will be in the attachment controller
}
