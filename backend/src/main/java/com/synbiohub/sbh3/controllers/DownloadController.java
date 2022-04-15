package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.services.DownloadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.SBOLDocument;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

@RestController
@RequiredArgsConstructor
@Slf4j
public class DownloadController {

    private final DownloadService downloadService;

    private final ObjectMapper mapper;

    @GetMapping(value = "*/metadata")
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

    @GetMapping(value = "*/sbolnr")
    public ResponseEntity<?> getSBOLNonRecursive(HttpServletRequest request) throws JsonProcessingException {
        var uri = request.getRequestURL().toString();
        String splitUri = uri.split("/sbolnr")[0];
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

    @GetMapping(value = "*/sbol")
    public ResponseEntity<?> getSBOLRecursiveRDF(HttpServletRequest request) {
        var uri = request.getRequestURL().toString();
        String splitUri = uri.split("/sbol")[0];

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

    @GetMapping(value = "*/gb")
    public ResponseEntity<?> getSBOLRecursiveGenbank(HttpServletRequest request) {
        var uri = request.getRequestURL().toString();
        String splitUri = uri.split("/gb")[0];

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

    @GetMapping(value = "*/fasta")
    public ResponseEntity<?> getSBOLRecursiveFasta(HttpServletRequest request) {
        var uri = request.getRequestURL().toString();
        String splitUri = uri.split("/fasta")[0];

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

    @GetMapping(value = "*/gff")
    public ResponseEntity<?> getSBOLRecursiveGff3(HttpServletRequest request) {
        var uri = request.getRequestURL().toString();
        String splitUri = uri.split("/gff")[0];

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


}
