package com.synbiohub.sbh3.dto.submit;

/**
 * Thrown when collection existence disagrees with {@code overwriteMerge} (legacy submit.js after metadata).
 */
public class SubmitConflictException extends RuntimeException {

    public SubmitConflictException(String message) {
        super(message);
    }
}
