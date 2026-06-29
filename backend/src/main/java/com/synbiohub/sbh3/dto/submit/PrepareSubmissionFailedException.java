package com.synbiohub.sbh3.dto.submit;

import lombok.Getter;

/** Validation/conversion failed during {@link com.synbiohub.sbh3.submit.PrepareSubmissionJob}. */
@Getter
public class PrepareSubmissionFailedException extends RuntimeException {

    private final String validationLog;
    private final PrepareSubmissionResult result;

    public PrepareSubmissionFailedException(PrepareSubmissionResult result) {
        super(result.getErrorLog() != null && !result.getErrorLog().isBlank()
                ? result.getErrorLog()
                : "Prepare submission failed");
        this.validationLog = result.getLog();
        this.result = result;
    }
}
