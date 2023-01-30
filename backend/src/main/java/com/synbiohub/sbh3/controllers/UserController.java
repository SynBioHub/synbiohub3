package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.config.services.CustomConfigurationService;
import com.synbiohub.sbh3.dto.LoginDTO;
import com.synbiohub.sbh3.dto.UserRegistrationDTO;
import com.synbiohub.sbh3.security.CustomUserService;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.ObjectMapperUtils;
import com.synbiohub.sbh3.utils.RestClient;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;

import javax.naming.AuthenticationException;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

@RestController
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final CustomUserService customUserService;
//    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final RestClient restClient;
    private final ObjectMapper mapper;
//    private final ConfigUtil configUtil;
//    private final CustomConfigurationService configurationService;

    @PostMapping(value = "/login", produces = "text/plain")
    public ResponseEntity login(@RequestBody LoginDTO loginDTO, HttpServletRequest request) {
        final String loginPath = "/login";
        final String tokenPath = "/token";
        String url = String.valueOf(request.getRequestURL());
        if (url.endsWith(loginPath)) {
            url = url.substring(0,url.length()-6) + tokenPath;
        } else {
            url = url + tokenPath;
        }
        return restClient.post(url, Map.of(), String.class, restClient.createHeaders(loginDTO.getUsername(), loginDTO.getPassword()));
//        Authentication auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginDTO.getUsernameOrEmail(), loginDTO.getPassword()));
//        if (auth == null) {
//            log.error("Bad credentials");
//            return new ResponseEntity(HttpStatus.UNAUTHORIZED);
//        }
//        SecurityContextHolder.getContext().setAuthentication(auth);
//        log.info("User logged in successfully");
//        return ResponseEntity.ok(RequestContextHolder.currentRequestAttributes().getSessionId());
    }

    // TODO: change what logout does, maybe not invalidate session, but invalidate current auth token
//    @PostMapping(value = "/logout")
//    @ResponseStatus(HttpStatus.OK)
//    public void logout(HttpSecurity http) throws Exception {
//        http.logout().logoutSuccessUrl("/login").invalidateHttpSession(true).deleteCookies("JSESSIONID");
//    }

    @PostMapping(value = "/register")
    public ResponseEntity registerNewUser(@RequestBody UserRegistrationDTO userRegistrationDTO) {
        try {
            customUserService.registerNewUserAccount(userRegistrationDTO);
        } catch (Exception e) {
            log.error("Error creating a new account.");
            e.printStackTrace();
            return new ResponseEntity(HttpStatus.BAD_REQUEST);
        }
        log.info("User registered successfully");
        return new ResponseEntity(HttpStatus.OK);
    }
//
//    @PostMapping(value = "/resetPassword")
//    public ResponseEntity<String> resetPassword(@RequestParam Map<String, String> allParams) {
//        return new ResponseEntity<>(HttpStatus.OK);
//    }
//
//    @PostMapping(value = "/setNewPassword")
//    public ResponseEntity<String> setNewPassword(@RequestParam Map<String, String> allParams) {
//        return new ResponseEntity<>(HttpStatus.OK);
//    }
//
    @GetMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> getProfile() throws JsonProcessingException {
        var user = userService.getUserProfile();
        if (user == null)
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(mapper.writeValueAsString(user));
    }
//
//    @PostMapping(value = "/profile", produces = "text/plain")
//    public ResponseEntity<String> updateProfile(@RequestParam Map<String, String> allParams) throws JsonProcessingException, AuthenticationException {
//        return userService.updateUser(mapper, allParams);
//
//    }
//
//    // TODO: this is hardcoded, but for true setup, need interceptor for this endpoint through frontend -> Ben
//    @PostMapping(value = "/setup")
//    public ResponseEntity<String> setup(@RequestParam Map<String, String> allParams) throws AuthenticationException {
//        if (configurationService.isLaunched()) {
//            return new ResponseEntity<>(HttpStatus.OK);
//        }
//        configurationService.save(allParams);
//        configurationService.save("firstLaunch", "false");
//        registerNewUser(userService.registerNewAdminUser(allParams)); // assumes no users in repository, should crate admin user
//        // only first user is admin
//        //userService.setUpConfig(allParams); // completely rewrites config.local.json
//        return new ResponseEntity<>(HttpStatus.OK);
//    }

    @GetMapping("/public/demotest1")
    public String publicTest() {
        return "public test worked.";
    }

    @GetMapping("/test/demotest2")
    public String privateTest(Authentication authentication) {
        return "Hello, " + authentication.getName() + "!";
    }

}
