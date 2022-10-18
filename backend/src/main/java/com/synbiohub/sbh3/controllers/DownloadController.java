package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.services.DownloadService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.SBOLDocument;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@RestController
@RequiredArgsConstructor
@Slf4j
public class DownloadController extends AntPathMatcher {

    private final DownloadService downloadService;

    private final ObjectMapper mapper;

    @GetMapping(value = "/public/{db}/{id}/{ver}/sbol")
    public ResponseEntity<?> getSBOLRecursiveRDF(@PathVariable String db, @PathVariable String id, @PathVariable String ver) {
//        var uri = request.getRequestURL().toString();
//        String splitUri = uri.split("/sbol")[0]; //TODO replace http://localhost:6789 with https://synbiohub.org
        String splitUri = ConfigUtil.get("triplestore").get("defaultGraph").toString().replace("\"","") + "/" + db + "/" + id + "/" + ver;
        String uri = splitUri + "/sbol";

        var sbolDocument = downloadService.getSBOLRecursive(splitUri);
        var byteOutput = new ByteArrayOutputStream();
        try {
            sbolDocument.write(byteOutput);
        } catch (Exception e) {
            log.error("Error writing SBOL to byte array!");
        }

        var uriArr = uri.split("/");
        return ResponseEntity
                .ok()
                //.contentLength(results.length)
                .contentType(
                        MediaType.parseMediaType("application/xml"))
                .header("Content-Disposition", "attachment; filename=\"" + uriArr[uriArr.length-3] + ".xml\"")
                .body(new InputStreamResource(new ByteArrayInputStream(byteOutput.toByteArray())));
    }

    @GetMapping(value = "/public/{db}/{id}/{ver}/sbolnr")
    public ResponseEntity<?> getSBOLNonRecursive(@PathVariable String db, @PathVariable String id, @PathVariable String ver) throws JsonProcessingException {
        String splitUri = ConfigUtil.get("triplestore").get("defaultGraph").toString().replace("\"","") + "/" + db + "/" + id + "/" + ver;
        String uri = splitUri + "/sbolnr";
        var results = downloadService.getSBOLNonRecursive(splitUri);
        //byte[] buf = mapper.writeValueAsBytes(results);
        var outputStream = new ByteArrayOutputStream();
        try {
            results.write(outputStream);
        } catch (Exception e) {
            log.error("Error writing SBOL to output!");
        }

        var uriArr = uri.split("/");
        return ResponseEntity
                .ok()
                //.contentLength(results.length)
                .contentType(
                        MediaType.parseMediaType("application/xml"))
                .header("Content-Disposition", "attachment; filename=\"" + uriArr[uriArr.length-3] + ".xml\"")
                .body(new InputStreamResource(new ByteArrayInputStream(outputStream.toByteArray())));
    }

    @GetMapping(value = "/public/{db}/{id}/{ver}/metadata")
    public ResponseEntity<?> getMetadata(@PathVariable String db, @PathVariable String id, @PathVariable String ver) throws JsonProcessingException {
        String splitUri = ConfigUtil.get("triplestore").get("defaultGraph").toString().replace("\"","") + "/" + db + "/" + id + "/" + ver;
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

    @GetMapping(value = "/public/{db}/{id}/{ver}/gb")
    public ResponseEntity<?> getSBOLRecursiveGenbank(@PathVariable String db, @PathVariable String id, @PathVariable String ver) {
        String splitUri = ConfigUtil.get("triplestore").get("defaultGraph").toString().replace("\"","") + "/" + db + "/" + id + "/" + ver;
        String uri = splitUri + "/gb";

        var sbolDocument = downloadService.getSBOLRecursive(splitUri);
        var byteOutput = new ByteArrayOutputStream();
        try {
            sbolDocument.write(byteOutput, SBOLDocument.GENBANK);
        } catch (Exception e) {
            log.error("Error writing SBOL to byte array!");
        }

        var uriArr = uri.split("/");
        return ResponseEntity
                .ok()
                //.contentLength(results.length)
                .contentType(
                        MediaType.parseMediaType("application/xml"))
                .header("Content-Disposition", "attachment; filename=\"" + uriArr[uriArr.length-3] + ".gb\"")
                .body(new InputStreamResource(new ByteArrayInputStream(byteOutput.toByteArray())));
    }

    @GetMapping(value = "/public/{db}/{id}/{ver}/fasta")
    public ResponseEntity<?> getSBOLRecursiveFasta(@PathVariable String db, @PathVariable String id, @PathVariable String ver) {
        String splitUri = ConfigUtil.get("triplestore").get("defaultGraph").toString().replace("\"","") + "/" + db + "/" + id + "/" + ver;
        String uri = splitUri + "/fasta";

        var sbolDocument = downloadService.getSBOLRecursive(splitUri);
        var byteOutput = new ByteArrayOutputStream();
        try {
            sbolDocument.write(byteOutput, SBOLDocument.FASTAformat);
        } catch (Exception e) {
            log.error("Error writing SBOL to byte array!");
        }

        var uriArr = uri.split("/");
        return ResponseEntity
                .ok()
                //.contentLength(results.length)
                .contentType(
                        MediaType.parseMediaType("application/xml"))
                .header("Content-Disposition", "attachment; filename=\"" + uriArr[uriArr.length-3] + ".fasta\"")
                .body(new InputStreamResource(new ByteArrayInputStream(byteOutput.toByteArray())));
    }

    @GetMapping(value = "/public/{db}/{id}/{ver}/gff")
    public ResponseEntity<?> getSBOLRecursiveGff3(@PathVariable String db, @PathVariable String id, @PathVariable String ver) {
        String splitUri = ConfigUtil.get("triplestore").get("defaultGraph").toString().replace("\"","") + "/" + db + "/" + id + "/" + ver;
        String uri = splitUri + "/gff";

        var sbolDocument = downloadService.getSBOLRecursive(splitUri);
        var byteOutput = new ByteArrayOutputStream();
        try {
            sbolDocument.write(byteOutput, SBOLDocument.GFF3format);
        } catch (Exception e) {
            log.error("Error writing SBOL to byte array!");
        }

        var uriArr = uri.split("/");
        return ResponseEntity
                .ok()
                //.contentLength(results.length)
                .contentType(
                        MediaType.parseMediaType("application/xml"))
                .header("Content-Disposition", "attachment; filename=\"" + uriArr[uriArr.length-3] + ".gff\"")
                .body(new InputStreamResource(new ByteArrayInputStream(byteOutput.toByteArray())));
    }

    // /download endpoint will be in the attachment controller
}
