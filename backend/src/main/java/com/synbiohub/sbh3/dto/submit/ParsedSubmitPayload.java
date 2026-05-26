package com.synbiohub.sbh3.dto.submit;

import lombok.Builder;
import lombok.Value;

/**
 * Step 1 output: post-parse submission shape (string fields from the form, optional file path, {@link #createdBy} from auth only).
 * Next pipeline stages validate against {@code databasePrefix} and the user's graph.
 */
@Value
@Builder
public class ParsedSubmitPayload {
    String id;
    String name;
    String description;
    String version;
    /** Raw citations string from the form (comma-separated etc.); parsed in a later step. */
    String citations;
    /** Legacy overwrite/merge mode: {@code "0"}–{@code "3"}. */
    String overwriteMerge;
    /** Submit plugin id; UI may send {@code plugins} — step 1 normalizes to this single field. */
    String plugin;
    /** Optional destination collection URI (merge / add-to-existing flows). */
    String collectionUri;
    /** Absolute path to a temp upload file, if a file part was present; {@code null} if none. */
    String uploadedFilePath;
    SubmitCreatedBy createdBy;
}
