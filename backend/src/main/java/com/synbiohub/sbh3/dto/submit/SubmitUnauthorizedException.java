package com.synbiohub.sbh3.dto.submit;

/**
 * Thrown when submit cannot proceed because the caller is not authenticated for submission
 * (e.g. missing {@link ParsedSubmitPayload#getCreatedBy()}).
 */
public class SubmitUnauthorizedException extends RuntimeException {

    public SubmitUnauthorizedException(String message) {
        super(message);
    }
}
