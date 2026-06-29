package com.synbiohub.sbh3.dto.submit;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Successful {@code /submit} HTTP body: sanitized submission fields at the root plus prepare result.
 */
@Getter
@AllArgsConstructor
public class SubmitOkPayload {
    @JsonUnwrapped
    private final SanitizedSubmitPayload submission;
    private final PrepareSubmissionResult prepareResult;
}
