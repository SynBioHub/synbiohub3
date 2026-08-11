package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dao.SparqlService;
import com.synbiohub.sbh3.security.customsecurity.ServletPathUtil;
import com.synbiohub.sbh3.services.DownloadService;
import com.synbiohub.sbh3.services.SearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.SBOLDocument;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Tag(name = "Downloads", description = "Endpoints for downloading and exporting registry objects in various formats (SBOL, GenBank, FASTA, GFF3)")
@RestController
@RequiredArgsConstructor
@Slf4j
public class DownloadController extends AntPathMatcher {

    private static final MediaType SBOL_RDF_XML = MediaType.parseMediaType("application/rdf+xml");
    private static final String USER_AUTH = "hasAnyAuthority('USER', 'CURATOR', 'ADMIN')";

    /**
     * Longest first so {@code similarCount} wins over {@code similar}, {@code usesCount} over {@code uses}.
     */
    private static final List<String> LINKED_SEARCH_SUFFIXES = List.of(
            "subCollections", "twinsCount", "similarCount", "usesCount", "twins", "similar", "uses");

    private final DownloadService downloadService;
    private final SearchService searchService;
    private final ObjectMapper mapper;
    private final SparqlService sparqlService;

    @Operation(summary = "Download SBOL (Versioned, public)", description = "Downloads the recursive SBOL2 RDF/XML for a specific version.")
    @ApiResponse(responseCode = "200", description = "SBOL2 RDF/XML file")
    @GetMapping("/public/{db}/{id}/{ver}/sbol")
    public ResponseEntity<?> getPublicSbolVersioned(
            @PathVariable String db, @PathVariable String id, @PathVariable String ver) throws IOException {
        return sbolXmlResponse(downloadService.publicVersionedObjectUri(db, id, ver), id);
    }

    @Operation(summary = "Download SBOL (Versioned, user)", description = "Downloads the recursive SBOL2 RDF/XML for a specific version.")
    @ApiResponse(responseCode = "200", description = "SBOL2 RDF/XML file")
    @PreAuthorize(USER_AUTH)
    @GetMapping("/user/{username}/{db}/{id}/{ver}/sbol")
    public ResponseEntity<?> getUserSbolVersioned(
            @PathVariable String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        return sbolXmlResponse(downloadService.userVersionedObjectUri(username, db, id, ver), id);
    }

    @Operation(summary = "Download SBOL (Latest, public)", description = "Resolves latest version via SPARQL and downloads the recursive SBOL2 RDF/XML.")
    @ApiResponse(responseCode = "200", description = "SBOL2 RDF/XML file")
    @ApiResponse(responseCode = "404", description = "URI not found")
    @GetMapping("/public/{db}/{id}/sbol")
    public ResponseEntity<?> getPublicSbolPersistentIdentity(
            @PathVariable String db, @PathVariable String id) throws IOException {
        return sbolFromPersistentIdentity(downloadService.publicPersistentIdentityUri(db, id), id);
    }

    @Operation(summary = "Download SBOL (Latest, user)", description = "Resolves latest version via SPARQL and downloads the recursive SBOL2 RDF/XML.")
    @ApiResponse(responseCode = "200", description = "SBOL2 RDF/XML file")
    @ApiResponse(responseCode = "404", description = "URI not found")
    @PreAuthorize(USER_AUTH)
    @GetMapping("/user/{username}/{db}/{id}/sbol")
    public ResponseEntity<?> getUserSbolPersistentIdentity(
            @PathVariable String username, @PathVariable String db, @PathVariable String id) throws IOException {
        return sbolFromPersistentIdentity(downloadService.userPersistentIdentityUri(username, db, id), id);
    }

    @Operation(summary = "Download SBOL (Alternate, public)", description = "Same SBOL document as /sbol but without the path suffix.")
    @ApiResponse(responseCode = "200", description = "SBOL2 RDF/XML file")
    @GetMapping("/public/{db}/{id}/**/{ver}")
    public ResponseEntity<?> getPublicSbolRecursiveRDF(
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver,
            HttpServletRequest request) throws IOException {
        String path = ServletPathUtil.getPathWithinApplication(request);
        ResponseEntity<?> linked = tryDispatchLinkedSearch(path);
        if (linked != null) {
            return linked;
        }
        return sbolXmlResponse(downloadService.publicObjectUriFromServletPath(path), id);
    }

    @Operation(summary = "Download SBOL (Alternate, user)", description = "Same SBOL document as /sbol but without the path suffix.")
    @ApiResponse(responseCode = "200", description = "SBOL2 RDF/XML file")
    @PreAuthorize(USER_AUTH)
    @GetMapping("/user/{username}/{db}/{id}/**/{ver}")
    public ResponseEntity<?> getUserSbolRecursiveRDF(
            @PathVariable String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver,
            HttpServletRequest request) throws IOException {
        String path = ServletPathUtil.getPathWithinApplication(request);
        ResponseEntity<?> linked = tryDispatchLinkedSearch(path);
        if (linked != null) {
            return linked;
        }
        return sbolXmlResponse(downloadService.userObjectUriFromServletPath(path), id);
    }

    private ResponseEntity<?> tryDispatchLinkedSearch(String pathWithinApplication) throws IOException {
        for (String suffix : LINKED_SEARCH_SUFFIXES) {
            String trailer = "/" + suffix;
            if (!pathWithinApplication.endsWith(trailer)) {
                continue;
            }
            String basePath = pathWithinApplication.substring(0, pathWithinApplication.length() - trailer.length());
            List<String> segments = pathSegments(basePath);
            if (segments.size() < 4) {
                return null;
            }
            String collectionInfo = collectionInfoFromSegments(segments);
            return linkedSearchResponse(suffix, collectionInfo);
        }
        return null;
    }

    private static String collectionInfoFromSegments(List<String> segments) {
        if (segments.size() >= 5 && "user".equals(segments.get(0))) {
            return String.join("/",
                    segments.get(0), segments.get(1), segments.get(2), segments.get(3), segments.get(4));
        }
        return String.join("/",
                segments.get(0), segments.get(1), segments.get(2), segments.get(3));
    }

    private static List<String> pathSegments(String path) {
        List<String> out = new ArrayList<>();
        for (String s : path.split("/")) {
            if (!s.isEmpty()) {
                out.add(s);
            }
        }
        return out;
    }

    private ResponseEntity<?> linkedSearchResponse(String suffix, String collectionInfo) throws IOException {
        return switch (suffix) {
            case "subCollections" -> ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(searchService.collectionToOutput(
                            sparqlService.read(sparqlService.getExplorerUrl(),
                                    sparqlService.resolveGraphUri(""),
                                    sparqlService.getSubCollectionsSPARQL(collectionInfo))));
            case "twins" -> ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(searchService.rawJSONToOutput(
                            sparqlService.read(sparqlService.getExplorerUrl(),
                                    sparqlService.resolveGraphUri(""),
                                    sparqlService.getURISPARQL(collectionInfo, "twins"))));
            case "twinsCount" -> ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(searchService.JSONToCount(
                            sparqlService.read(sparqlService.getExplorerUrl(),
                                    sparqlService.resolveGraphUri(""),
                                    sparqlService.getTwinsCountSPARQL(collectionInfo))));
            case "similar" -> ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(searchService.rawJSONToOutput(
                            sparqlService.read(sparqlService.getExplorerUrl(),
                                    sparqlService.resolveGraphUri(""),
                                    sparqlService.getURISPARQL(collectionInfo, "similar"))));
            case "similarCount" -> ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(searchService.JSONToCount(
                            sparqlService.read(sparqlService.getExplorerUrl(),
                                    sparqlService.resolveGraphUri(""),
                                    sparqlService.getSimilarCountSPARQL(collectionInfo))));
            case "uses" -> ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(searchService.rawJSONToOutput(
                            sparqlService.read(sparqlService.getExplorerUrl(),
                                    sparqlService.resolveGraphUri(""),
                                    sparqlService.getURISPARQL(collectionInfo, "uses"))));
            case "usesCount" -> ResponseEntity.ok()
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(searchService.JSONToCount(
                            sparqlService.read(sparqlService.getExplorerUrl(),
                                    sparqlService.resolveGraphUri(""),
                                    sparqlService.getUsesCountSPARQL(collectionInfo))));
            default -> throw new IllegalStateException("unexpected linked-search suffix: " + suffix);
        };
    }

    private ResponseEntity<?> sbolFromPersistentIdentity(String persistent, String id) throws IOException {
        String topUri = downloadService.resolveLatestVersionedUri(persistent);
        if (topUri == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body("uri not found");
        }
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

    @Operation(summary = "Download non-recursive SBOL (public)", description = "Downloads the non-recursive SBOL2 RDF/XML for a specific version.")
    @ApiResponse(responseCode = "200", description = "SBOL2 RDF/XML file")
    @GetMapping("/public/{db}/{id}/{ver}/sbolnr")
    public ResponseEntity<?> getPublicSBOLNonRecursive(
            @PathVariable String db, @PathVariable String id, @PathVariable String ver) throws IOException {
        return sbolnrResponse(downloadService.publicVersionedObjectUri(db, id, ver), id);
    }

    @Operation(summary = "Download non-recursive SBOL (user)", description = "Downloads the non-recursive SBOL2 RDF/XML for a specific version.")
    @ApiResponse(responseCode = "200", description = "SBOL2 RDF/XML file")
    @PreAuthorize(USER_AUTH)
    @GetMapping("/user/{username}/{db}/{id}/{ver}/sbolnr")
    public ResponseEntity<?> getUserSBOLNonRecursive(
            @PathVariable String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        return sbolnrResponse(downloadService.userVersionedObjectUri(username, db, id, ver), id);
    }

    private ResponseEntity<?> sbolnrResponse(String topUri, String id) throws IOException {
        byte[] body = downloadService.getSBOLNonRecursiveRdfXmlBytes(topUri);
        return ResponseEntity.ok()
                .contentType(SBOL_RDF_XML)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + ".xml\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(new InputStreamResource(new ByteArrayInputStream(body)));
    }

    @Operation(summary = "Download metadata", description = "Downloads the JSON metadata for a specific object.")
    @ApiResponse(responseCode = "200", description = "JSON metadata file")
    @GetMapping("/public/{db}/{id}/**/{ver}/metadata")
    public ResponseEntity<?> getMetadata(
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver,
            HttpServletRequest request) throws IOException {
        String path = ServletPathUtil.getPathWithinApplication(request);
        String splitUri = downloadService.publicMetadataSplitUriFromServletPath(path);
        String results = downloadService.getMetadata(splitUri);
        byte[] buf = mapper.writeValueAsBytes(mapper.readTree(results));

        return ResponseEntity.ok()
                .contentLength(buf.length)
                .contentType(MediaType.parseMediaType("application/octet-stream"))
                .header("Content-Disposition", "attachment; filename=\"" + id + ".json\"")
                .body(new InputStreamResource(new ByteArrayInputStream(buf)));
    }

    @Operation(summary = "Download GenBank (public)", description = "Downloads the GenBank format export of the specified object.")
    @ApiResponse(responseCode = "200", description = "GenBank (.gb) file")
    @GetMapping("/public/{db}/{id}/{ver}/gb")
    public ResponseEntity<?> getPublicGenbank(
            @PathVariable String db, @PathVariable String id, @PathVariable String ver) throws IOException {
        return genbankResponse(downloadService.publicVersionedObjectUri(db, id, ver), id);
    }

    @Operation(summary = "Download GenBank (user)", description = "Downloads the GenBank format export of the specified object.")
    @ApiResponse(responseCode = "200", description = "GenBank (.gb) file")
    @PreAuthorize(USER_AUTH)
    @GetMapping("/user/{username}/{db}/{id}/{ver}/gb")
    public ResponseEntity<?> getUserGenbank(
            @PathVariable String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        return genbankResponse(downloadService.userVersionedObjectUri(username, db, id, ver), id);
    }

    private ResponseEntity<?> genbankResponse(String topUri, String id) throws IOException {
        var sbolDocument = downloadService.getSBOLRecursive(topUri);
        var byteOutput = new ByteArrayOutputStream();
        try {
            sbolDocument.write(byteOutput, SBOLDocument.GENBANK);
        } catch (Exception e) {
            log.error("Error writing SBOL to byte array!");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/xml"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + ".gb\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(new InputStreamResource(new ByteArrayInputStream(byteOutput.toByteArray())));
    }

    @Operation(summary = "Download FASTA (public)", description = "Downloads the FASTA format export of the specified object.")
    @ApiResponse(responseCode = "200", description = "FASTA file")
    @ApiResponse(responseCode = "404", description = "No sequences found")
    @GetMapping("/public/{db}/{id}/{ver}/fasta")
    public ResponseEntity<?> getPublicFasta(
            @PathVariable String db, @PathVariable String id, @PathVariable String ver) throws IOException {
        return fastaResponse(downloadService.publicVersionedObjectUri(db, id, ver), id);
    }

    @Operation(summary = "Download FASTA (user)", description = "Downloads the FASTA format export of the specified object.")
    @ApiResponse(responseCode = "200", description = "FASTA file")
    @ApiResponse(responseCode = "404", description = "No sequences found")
    @PreAuthorize(USER_AUTH)
    @GetMapping("/user/{username}/{db}/{id}/{ver}/fasta")
    public ResponseEntity<?> getUserFasta(
            @PathVariable String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        return fastaResponse(downloadService.userVersionedObjectUri(username, db, id, ver), id);
    }

    private ResponseEntity<?> fastaResponse(String topUri, String id) throws IOException {
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

    @Operation(summary = "Download GFF3 (public)", description = "Downloads the GFF3 format export of the specified object.")
    @ApiResponse(responseCode = "200", description = "GFF3 file")
    @GetMapping("/public/{db}/{id}/{ver}/gff")
    public ResponseEntity<?> getPublicGff3(
            @PathVariable String db, @PathVariable String id, @PathVariable String ver) throws IOException {
        return gff3Response(downloadService.publicVersionedObjectUri(db, id, ver), id);
    }

    @Operation(summary = "Download GFF3 (user)", description = "Downloads the GFF3 format export of the specified object.")
    @ApiResponse(responseCode = "200", description = "GFF3 file")
    @PreAuthorize(USER_AUTH)
    @GetMapping("/user/{username}/{db}/{id}/{ver}/gff")
    public ResponseEntity<?> getUserGff3(
            @PathVariable String username,
            @PathVariable String db,
            @PathVariable String id,
            @PathVariable String ver) throws IOException {
        return gff3Response(downloadService.userVersionedObjectUri(username, db, id, ver), id);
    }

    private ResponseEntity<?> gff3Response(String topUri, String id) throws IOException {
        var sbolDocument = downloadService.getSBOLRecursive(topUri);
        var byteOutput = new ByteArrayOutputStream();
        try {
            sbolDocument.write(byteOutput, SBOLDocument.GFF3format);
        } catch (Exception e) {
            log.error("Error writing SBOL to byte array!");
        }
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/xml"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + id + ".gff\"")
                .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                .body(new InputStreamResource(new ByteArrayInputStream(byteOutput.toByteArray())));
    }
}
