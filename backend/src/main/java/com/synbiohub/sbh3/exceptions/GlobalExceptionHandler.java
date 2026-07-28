package com.synbiohub.sbh3.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import lombok.extern.slf4j.Slf4j;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(LoginFailedException.class)
    public ResponseEntity<String> handleLoginFailed(LoginFailedException ex) {
        log.error("Login failed: {}", ex.getMessage());
        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED) // 401 — matches your /login OpenAPI docs
                .body(ex.getMessage()); // "Login failed"
    }

    @ExceptionHandler(RegistrationFailedException.class)
    public ResponseEntity<String> handleRegistrationFailed(RegistrationFailedException ex) {
        log.error("Registration failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
    }
}