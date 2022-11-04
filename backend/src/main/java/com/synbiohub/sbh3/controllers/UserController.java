package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dto.UserRegistrationDTO;
import com.synbiohub.sbh3.security.CustomUserService;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.ObjectMapperUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;

import javax.naming.AuthenticationException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.util.Map;
import java.util.Objects;

@RestController
@AllArgsConstructor
@Slf4j
public class UserController {

    private final CustomUserService customUserService;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final ObjectMapper mapper;
    private final ConfigUtil configUtil;

    @PostMapping(value = "/login", produces = "text/plain", consumes = "application/x-www-form-urlencoded")
    public ResponseEntity login(@RequestParam String email, @RequestParam String password, HttpServletRequest request, HttpServletResponse response) {
        Authentication auth = userService.checkValidLogin(authenticationManager, email, password);
        if (auth == null) {
            log.error("Bad credentials");
            return new ResponseEntity(HttpStatus.UNAUTHORIZED);
        }
        var securityContext = SecurityContextHolder.getContext();
        securityContext.setAuthentication(auth);
        request.getSession().setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
        log.info("User logged in successfully");
        return ResponseEntity.ok(RequestContextHolder.currentRequestAttributes().getSessionId());
    }

    @PostMapping(value = "/logout")
    @ResponseStatus(HttpStatus.OK)
    public void logout(HttpSession session) {
        session.invalidate();
    }

    @PostMapping(value = "/register")
    public ResponseEntity registerNewUser(@RequestParam Map<String, String> params) {
        try {
            var userRegistrationDTO = ObjectMapperUtils.map(params, UserRegistrationDTO.class);
            customUserService.registerNewUserAccount(userRegistrationDTO);
        } catch (Exception e) {
            log.error("Error creating a new account.");
            e.printStackTrace();
            return new ResponseEntity(HttpStatus.BAD_REQUEST);
        }
        log.info("User registered successfully");
        return new ResponseEntity(HttpStatus.OK);
    }

    @PostMapping(value = "/resetPassword")
    public ResponseEntity<String> resetPassword(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @PostMapping(value = "/setNewPassword")
    public ResponseEntity<String> setNewPassword(@RequestParam Map<String, String> allParams) {
        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> getProfile() throws JsonProcessingException {
        var user = userService.getUserProfile();
        if (user == null)
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(mapper.writeValueAsString(user));
    }

    @PostMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> updateProfile(@RequestParam Map<String, String> allParams) throws JsonProcessingException, AuthenticationException {
        return userService.updateUser(mapper, allParams);

    }

    @PostMapping(value = "/setup")
    public ResponseEntity<String> setup(@RequestParam Map<String, String> allParams) throws AuthenticationException {
        if (configUtil.isLaunched()) {
            return new ResponseEntity<>(HttpStatus.OK);
        }
        registerNewUser(allParams); // may need to change this method if mapper doesn't work correctly (params don't line up)
        userService.setUpConfig(allParams);
        return new ResponseEntity<>(HttpStatus.OK);
    }





}
