package com.synbiohub.sbh3.submit;

import lombok.Data;
import org.sbolstandard.core2.SBOLDocument;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Single mutable carrier for the entire submit pipeline (parse → sanitize → SBOL → upload).
 * Fields are populated incrementally; unset values remain {@code null} until their step runs.
 * <p>
 * Derived values ({@link #collectionDisplayId()}, {@link #uriPrefix()}) are
 * computed from other fields rather than stored separately.
 */
@Data
public class SubmitPayload {

    // --- Request / parsed ---

    /** User-defined collection identifier (alphanumeric and underscores). */
    private String id;

    private String name;
    private String description;

    /** Version string (e.g. {@code "1"}). */
    private String version;

    /** Raw comma-separated PubMed IDs from the form; consumed by {@code sanitize}. */
    private String citations;

    /** {@code overwrite_merge} form value: 0–3. */
    private String overwriteMerge;

    /** Submit plugin id (e.g. {@code default}). */
    private String plugin;

    /**
     * Target root collection identity URI.
     * From {@code rootCollections} when submitting into an existing collection, or computed
     * during sanitization for new collections.
     */
    private String collectionUri;

    /** Path to the uploaded file on disk (temp file). */
    private String uploadedFilePath;

    private String createdBy;

    // --- Sanitized / resolved ---

    /** Parsed PubMed citation ids (from the form {@code citations} field). */
    private List<Integer> citationPubmedIds = new ArrayList<>();

    /** Store snapshot when collection metadata exists in the triple store. */
    private SubmitRootCollectionMetadata existingCollection;

    // --- readSbol ---

    /** Composite SBOL document built during {@code readSbol}. */
    private SBOLDocument sbolDocument;

    private List<Path> attachmentFiles = new ArrayList<>();
    private List<Path> sbolFiles = new ArrayList<>();
    private Set<String> urisFoundInSynBioHub = new HashSet<>();

    /** {@link System#currentTimeMillis()} when {@code readSbol} setup started. */
    private Long readSbolStartedAtMs;

    /** Serialized SBOL XML from {@code readSbol} (legacy {@code resultFilename}). */
    private String resultFilePath;

    /** Temp unpack directory when archive extraction ran. */
    private String extractDirPath;

    // --- Derived accessors ---

    public String collectionDisplayId() {
        return id == null ? null : id + "_collection";
    }

    public void setOverwrite_merge(String overwriteMerge) {
        this.overwriteMerge = overwriteMerge;
    }
}
