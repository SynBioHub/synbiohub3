package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.synbiohub.sbh3.dto.LoginDTO;
import com.synbiohub.sbh3.dto.UserRegistrationDTO;
import com.synbiohub.sbh3.security.CustomUserService;
import com.synbiohub.sbh3.security.customsecurity.AuthenticationResponse;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.utils.RestClient;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URL;
import java.util.Map;

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

//    @PostMapping(value = "/login", produces = "text/plain")
//    public ResponseEntity login(@RequestBody LoginDTO loginDTO, HttpServletRequest request) {
//        final String loginPath = "/login";
//        final String tokenPath = "/token";
//        String url = String.valueOf(request.getRequestURL());
//        if (url.endsWith(loginPath)) {
//            url = url.substring(0,url.length()-6) + tokenPath;
//        } else {
//            url = url + tokenPath;
//        }
//        return restClient.post(url, Map.of(), String.class, restClient.createHeaders(loginDTO.getUsername(), loginDTO.getPassword()));
//        Authentication auth = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(loginDTO.getUsernameOrEmail(), loginDTO.getPassword()));
//        if (auth == null) {
//            log.error("Bad credentials");
//            return new ResponseEntity(HttpStatus.UNAUTHORIZED);
//        }
//        SecurityContextHolder.getContext().setAuthentication(auth);
//        log.info("User logged in successfully");
//        return ResponseEntity.ok(RequestContextHolder.currentRequestAttributes().getSessionId());
//    }

//    @PostMapping(value = "/login", produces = "text/plain")
//    public ResponseEntity login(@RequestParam String email, @RequestParam String password, HttpServletRequest request) {
//        LoginDTO loginDTO = LoginDTO
//                .builder()
//                .email(email)
//                .password(password)
//                .build();
//        final String loginPath = "/login";
//        final String tokenPath = "/token";
//        String url = String.valueOf(request.getRequestURL());
//        if (url.endsWith(loginPath)) {
//            url = url.substring(0, url.length() - 6) + tokenPath;
//        } else {
//            url = url + tokenPath;
//        }
//        return restClient.post(url, Map.of(), String.class, restClient.createHeaders(loginDTO.getEmail(), loginDTO.getPassword()));
//    }

//    @PostMapping(value = "/login", produces = "text/plain")
//    public ResponseEntity login(@RequestParam String email, @RequestParam String password) {
//        LoginDTO loginRequest = LoginDTO
//                .builder()
//                .email(email)
//                .password(password)
//                .build();
//        return ResponseEntity.ok(userService.authenticate(loginRequest));
//    }

    @PostMapping(value = "/login", produces = "text/plain")
    public ResponseEntity login(@RequestParam String email, @RequestParam String password) {
        String username = email;
        if (userService.isValidEmail(email)) {
            username = userService.getUserByEmail(email).getUsername();
        }
        LoginDTO loginRequest = LoginDTO
                .builder()
                .username(username)
                .password(password)
                .build();
        AuthenticationResponse response = userService.authenticate(loginRequest);
        return ResponseEntity.ok(response.getToken());
    }

    // TODO: change what logout does, maybe not invalidate session, but invalidate current auth token
//    @PostMapping(value = "/logout")
//    @ResponseStatus(HttpStatus.OK)
//    public void logout(HttpSecurity http) throws Exception {
//        http.logout().logoutSuccessUrl("/login").invalidateHttpSession(true).deleteCookies("JSESSIONID");
//    }

//    @PostMapping(value = "/register")
//    public ResponseEntity registerNewUser(@RequestBody UserRegistrationDTO userRegistrationDTO) {
//        try {
//            customUserService.registerNewUserAccount(userRegistrationDTO);
//        } catch (Exception e) {
//            log.error("Error creating a new account.");
//            e.printStackTrace();
//            return new ResponseEntity(HttpStatus.BAD_REQUEST);
//        }
//        log.info("User registered successfully");
//        return new ResponseEntity(HttpStatus.OK);
//    }

    @PostMapping(value = "/register")
    public ResponseEntity registerNewUser(@RequestParam String username, @RequestParam String name, @RequestParam String affiliation, @RequestParam String email, @RequestParam String password1, @RequestParam String password2) {
        try {
            log.info("Registering a new user.");
            UserRegistrationDTO userRegistrationDTO = UserRegistrationDTO
                    .builder()
                    .username(username)
                    .name(name)
                    .affiliation(affiliation)
                    .email(email)
                    .password1(password1)
                    .password2(password2)
                    .build();
            AuthenticationResponse response = userService.register(userRegistrationDTO);
            return ResponseEntity.ok(response.getToken());
        } catch (Exception e) {
            log.error("Error creating a new account.");
            e.printStackTrace();
            return new ResponseEntity(HttpStatus.BAD_REQUEST);
        }
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

    @GetMapping(value = "/profile1", produces = "text/plain")
    public ResponseEntity<String> getProfile1() throws JsonProcessingException {
        return ResponseEntity.ok("test");
    }
//
//    @PostMapping(value = "/profile", produces = "text/plain")
//    public ResponseEntity<String> updateProfile(@RequestParam Map<String, String> allParams) throws JsonProcessingException, AuthenticationException {
//        return userService.updateUser(mapper, allParams);
//
//    }
//
    // TODO: this is hardcoded, but for true setup, need interceptor for this endpoint through frontend -> Ben
    @PostMapping(value = "/setup")
    public ResponseEntity<String> setup(@RequestBody Map<String, String> allParams) {
        String fileName = "config.local.json";
        String workingDirectory = System.getProperty("user.dir");
        File file = new File(workingDirectory + File.separator + fileName);

        ObjectMapper mapper = new ObjectMapper();
        mapper.enable(SerializationFeature.INDENT_OUTPUT);

        try {
            if (file.createNewFile()) {
                String json = mapper.writeValueAsString(allParams);
                FileWriter fw = new FileWriter(file.getAbsoluteFile());
                BufferedWriter bw = new BufferedWriter(fw);
                bw.write(json);
                bw.close();
                return ResponseEntity.ok("File created successfully!");
            } else {
                return ResponseEntity.ok("File already exists!");
            }
        } catch (IOException e) {
            return ResponseEntity.ok("Failed to create file!");
        }



//        if (configurationService.isLaunched()) {
//            return new ResponseEntity<>(HttpStatus.OK);
//        }
//        configurationService.save(allParams);
//        configurationService.save("firstLaunch", "false");
//        registerNewUser(userService.registerNewAdminUser(allParams)); // assumes no users in repository, should crate admin user
//        // only first user is admin
//        //userService.setUpConfig(allParams); // completely rewrites config.local.json
//        return new ResponseEntity<>(HttpStatus.OK);
    }

    @GetMapping("/firstLaunched")
    public Boolean checkFirstLaunch() {
        String fileName = "config.local.json";
        String workingDirectory = System.getProperty("user.dir");
        File file = new File(workingDirectory + File.separator + fileName);

        return file.exists();
    }

    @GetMapping("/public/demotest1")
    public String publicTest() {
        return "public test worked.";
    }

    @GetMapping("/test/demotest2")
    public String privateTest(Authentication authentication) {
        return "Hello, " + authentication.getName() + "!";
    }

}
