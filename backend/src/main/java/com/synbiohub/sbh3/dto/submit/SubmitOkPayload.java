package com.synbiohub.sbh3.dto.submit;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Successful {@code /submit} HTTP body: {@link SanitizedSubmitPayload} fields at the root (backward compatible)
 * plus a {@code prepareSubmission} object for {@code PrepareSubmissionJob}.
 */
@Getter
@AllArgsConstructor
public class SubmitOkPayload {
    @JsonUnwrapped
    private final SanitizedSubmitPayload submission;
    private final JsonNode prepareSubmission;
}
