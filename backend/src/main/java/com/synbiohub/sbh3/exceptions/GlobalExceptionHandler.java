package com.synbiohub.sbh3.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(LoginFailedException.class)
    public ResponseEntity<String> handleLoginFailed(LoginFailedException ex) {
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED) // 401 — matches your /login OpenAPI docs
                .body(ex.getMessage());          // "Login failed"
    }
}