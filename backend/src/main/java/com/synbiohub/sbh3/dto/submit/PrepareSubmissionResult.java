package com.synbiohub.sbh3.dto.submit;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

/** In-process result from {@link com.synbiohub.sbh3.submit.PrepareSubmissionJob#execute()}. */
@Value
@Builder
public class PrepareSubmissionResult {
    boolean success;
    String log;
    String errorLog;
    /** Path to prepared SBOL XML when {@link #success}. */
    String resultFilename;
    /** Attachment path → COMBINE format IRI. */
    Map<String, String> attachmentFiles;
    /** Temp extract dir for archives; may be empty. */
    String extractDirPath;
}
