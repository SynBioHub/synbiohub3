package com.synbiohub.sbh3.controllers;

import com.synbiohub.sbh3.security.CustomUserService;
import com.synbiohub.sbh3.services.SearchService;

import com.synbiohub.sbh3.services.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class SubmitController {
}