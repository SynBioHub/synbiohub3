package com.synbiohub.sbh3.exceptions;


import org.springframework.security.core.AuthenticationException;

public class UserAlreadyExistsException extends AuthenticationException {

//    public UserAlreadyExistsException() { super(); }

    public UserAlreadyExistsException(String message) { super(message); }
}
