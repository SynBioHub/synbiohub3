package com.synbiohub.sbh3.utils;

import com.synbiohub.sbh3.dto.SubmitFileFormat;
import com.synbiohub.sbh3.submit.SubmitPayload;
import org.apache.commons.io.FilenameUtils;
import org.sbolstandard.core2.SBOLReader;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

public interface FileUtil {

     static String fileExtension(Path file) {
        String ext = FilenameUtils.getExtension(file.getFileName().toString());
        return ext == null ? "" : ext.toLowerCase();
    }

    /** COMBINE archives contain a manifest.xml entry. */
     static boolean isCombineArchive(Path file) throws IOException {
        if (!"zip".equals(fileExtension(file)) && !"omex".equals(fileExtension(file))) {
            return false;
        }
        try (ZipFile zip = new ZipFile(file.toFile())) {
            return zip.getEntry("manifest.xml") != null
                    || zip.stream().anyMatch(e -> e.getName().endsWith("manifest.xml"));
        }
    }

    /** Extracts a zip/omex archive and classifies each entry; sets {@code extractDirPath}. */
    static void extractSubmitArchive(Path archive, SubmitPayload payload, boolean combine)
            throws IOException {
        Path dest = Files.createTempDirectory("sbh-submit-unpack-");
        payload.setExtractDirPath(dest.toAbsolutePath().toString());
        try (ZipFile zip = new ZipFile(archive.toFile())) {
            var entries = zip.entries();
            while (entries.hasMoreElements()) {
                ZipEntry entry = entries.nextElement();
                if (entry.isDirectory()) {
                    continue;
                }
                Path out = dest.resolve(entry.getName()).normalize();
                if (!out.startsWith(dest)) {
                    continue; // zip-slip guard
                }
                Files.createDirectories(out.getParent());
                try (InputStream in = zip.getInputStream(entry)) {
                    Files.copy(in, out);
                }
                classifySubmitFile(out, payload);
            }
        }
        if (combine && payload.getSbolFiles().isEmpty()) {
            payload.getSbolFiles().add(archive);
        }
    }

    /** Routes a single file into sbolFiles or attachmentFiles. */
    static void classifySubmitFile(Path file, SubmitPayload payload) throws IOException {
        switch (guessSubmitFileFormat(file)) {
            case SBOL, GENBANK, FASTA, GFF3 -> payload.getSbolFiles().add(file);
            case ATTACHMENT -> payload.getAttachmentFiles().add(file);
        }
    }

    /** Sniffs file content and extension; anything unrecognized becomes an attachment. */
    static SubmitFileFormat guessSubmitFileFormat(Path file) throws IOException {
        String path = file.toAbsolutePath().toString();
        if (SBOLReader.isGenBankFile(path)) {
            return SubmitFileFormat.GENBANK;
        }
        if (SBOLReader.isFastaFile(path)) {
            return SubmitFileFormat.FASTA;
        }
        if (SBOLReader.isGFF3File(path)) {
            return SubmitFileFormat.GFF3;
        }

        String head = readFileHead(file, 4096).toLowerCase();
        if (head.contains("sbols.org") || head.contains("sbol.org") || head.contains("<rdf:rdf")) {
            return SubmitFileFormat.SBOL;
        }

        String ext = fileExtension(file);
        if (Set.of("xml", "sbol", "rdf").contains(ext)) {
            return SubmitFileFormat.SBOL;
        }
        if ("gb".equals(ext) || "gbk".equals(ext)) {
            return SubmitFileFormat.GENBANK;
        }
        if ("fasta".equals(ext) || "fa".equals(ext)) {
            return SubmitFileFormat.FASTA;
        }
        if ("gff".equals(ext) || "gff3".equals(ext)) {
            return SubmitFileFormat.GFF3;
        }

        return SubmitFileFormat.ATTACHMENT;
    }

     static String readFileHead(Path file, int maxBytes) throws IOException {
        byte[] buf = new byte[maxBytes];
        int read;
        try (InputStream in = Files.newInputStream(file)) {
            read = in.read(buf);
        }
        if (read <= 0) {
            return "";
        }
        return new String(buf, 0, read, StandardCharsets.UTF_8);
    }

    public static String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) {
            return "upload";
        }
        return FilenameUtils.getName(name).replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    /** Removes unpack directory and prepared SBOL XML after successful upload. */
    public static void cleanupSubmitTemp(SubmitPayload payload) throws IOException {
        // TODO: move to FileUtil
        String extractDir = payload.getExtractDirPath();
        if (extractDir != null && !extractDir.isBlank()) {
            deleteRecursive(Path.of(extractDir));
        }
        String resultPath = payload.getResultFilePath();
        if (resultPath != null && !resultPath.isBlank()) {
            Files.deleteIfExists(Path.of(resultPath));
        }
    }

    private static void deleteRecursive(Path root) throws IOException {
        if (!Files.exists(root)) {
            return;
        }
        try (var walk = Files.walk(root)) {
            walk.sorted((a, b) -> b.compareTo(a))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException e) {
                            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                                    "Failed to delete " + path, e);
                        }
                    });
        }
    }
}
