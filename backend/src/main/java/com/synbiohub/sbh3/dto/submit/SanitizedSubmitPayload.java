package com.synbiohub.sbh3.dto.submit;

import lombok.Builder;
import lombok.Value;

import java.util.List;

/**
 * Step 2 output after {@link com.synbiohub.sbh3.services.SubmitSanitizationService#sanitizeSubmission}:
 * parsed fields plus server-resolved {@link #collectionUri} and {@link #collectionId} for new and existing-collection flows.
 */
@Value
@Builder(toBuilder = true)
public class SanitizedSubmitPayload {
    String id;
    String name;
    String description;
    String version;
    /** Raw citations string after trim (empty if none). */
    String citations;
    String overwriteMerge;
    String plugin;
    /** Canonical private collection graph URI (root collection object identity). */
    String collectionUri;
    /** Root collection displayId, e.g. {@code mylib_collection}. */
    String collectionId;
    /** PubMed IDs from {@link #citations}; empty when citations absent or blank. */
    List<Integer> citationArray;
    String uploadedFilePath;
    SubmitCreatedBy createdBy;
    /** After {@code /submit} collection lookup: whether {@link #collectionUri} is already in the user's graph. */
    boolean collectionExists;
    /** Present when {@link #collectionExists}; otherwise null. */
    SubmitRootCollectionMetadata existingCollection;

    public static SanitizedSubmitPayload fromParsed(
            ParsedSubmitPayload p,
            String collectionUri,
            String collectionId,
            List<Integer> citationArray) {
        return SanitizedSubmitPayload.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .version(p.getVersion())
                .citations(p.getCitations() != null ? p.getCitations() : "")
                .overwriteMerge(p.getOverwriteMerge())
                .plugin(p.getPlugin())
                .collectionUri(collectionUri)
                .collectionId(collectionId)
                .citationArray(citationArray)
                .uploadedFilePath(p.getUploadedFilePath())
                .createdBy(p.getCreatedBy())
                .collectionExists(false)
                .existingCollection(null)
                .build();
    }
}
