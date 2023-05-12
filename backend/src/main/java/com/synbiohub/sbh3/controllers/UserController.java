package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.synbiohub.sbh3.dto.LoginDTO;
import com.synbiohub.sbh3.dto.UserRegistrationDTO;
import com.synbiohub.sbh3.security.CustomUserService;
import com.synbiohub.sbh3.security.customsecurity.AuthenticationResponse;
import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.security.repo.AuthRepository;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.RestClient;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.bind.annotation.*;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final CustomUserService customUserService;
//    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final RestClient restClient;
    private final ObjectMapper mapper;
    private final AuthRepository authRepository;


    @PostMapping(value = "/login", produces = "text/plain")
    public ResponseEntity login(@RequestParam String email, @RequestParam String password) {
        try {
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
            Optional<AuthCodes> existingAuthCode = authRepository.findByName(username);
            if (authRepository.findByName(username).isPresent()) {
                AuthCodes authCode = authRepository.findByName(username).get();
                authCode.setAuth(response.getToken());
                authRepository.save(authCode);
            } else {
                AuthCodes authCode = AuthCodes.builder()
                        .name(username)
                        .auth(response.getToken())
                        .build();
                authRepository.save(authCode);
            }
            return ResponseEntity.ok(response.getToken());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Your e-mail address was not recognized.");
        }

    }

    // TODO: change what logout does, maybe not invalidate session, but invalidate current auth token
    @GetMapping(value = "/do_logout")
    public ResponseEntity<String> logout(HttpServletRequest request, HttpServletResponse response) throws Exception {
        log.info("Received logout request");
//        Authentication auth = userService.checkAuthentication();
        HttpSession session = request.getSession(false);
        if (session != null && session.getId() != null) {
            // Invalidate the user's session
            session.invalidate();
        }
//        if (auth != null) {
//            new SecurityContextLogoutHandler().logout(request, response, auth);
//            Cookie jsessionidCookie = new Cookie("JSESSIONID", null);
//            jsessionidCookie.setMaxAge(0);
//            jsessionidCookie.setPath("/");
//            response.addCookie(jsessionidCookie);
//
//            Cookie authorizationCookie = new Cookie("authorization", null);
//            authorizationCookie.setMaxAge(0);
//            authorizationCookie.setPath("/");
//            response.addCookie(authorizationCookie);
//            authRepository.delete(authRepository.findByName(auth.getName()).orElseThrow());

            return ResponseEntity.ok("User logged out successfully");
//        } else {
//            throw new Exception("No user is currently logged in.");
//        }
    }

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
    public ResponseEntity<String> getProfile(HttpServletRequest request) throws Exception {
        String inputToken = request.getHeader("X-authorization");
        var user = userService.getUserProfile(inputToken);
        if (user == null)
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(mapper.writeValueAsString(user));
    }

    // Only updates the fields name, email, and affiliation currently
    @PostMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> updateProfile(@RequestParam Map<String, String> allParams, HttpServletRequest request) throws Exception {
        String inputToken = request.getHeader("X-authorization");
        User updatedUser = userService.updateUser(allParams, inputToken);
        if (updatedUser == null) {
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        }
        User copyUser = (User) updatedUser.clone();
        copyUser.setPassword("");
        return ResponseEntity.ok("Profile updated successfully");
    }

    @PostMapping(value = "/setup")
    public ResponseEntity<String> setup(@RequestBody Map<String, Object> allParams) {
        log.info(String.valueOf(allParams));
        String fileName = "config.local.json";
        String workingDirectory = System.getProperty("user.dir") + "/data";
        File file = new File(workingDirectory + File.separator + fileName);

        ObjectMapper mapper = new ObjectMapper();
        mapper.enable(SerializationFeature.INDENT_OUTPUT);

        Map<String, String> userParams = new HashMap<>();
        UserRegistrationDTO userRegistrationDTO = UserRegistrationDTO
                .builder()
                .username((String) allParams.get("userName"))
                .name((String) allParams.get("userFullName"))
                .affiliation((String) allParams.get("affiliation"))
                .email((String) allParams.get("userEmail"))
                .password1((String) allParams.get("userPassword"))
                .password2((String) allParams.get("userPasswordConfirm"))
                .build();
        userService.register(userRegistrationDTO);

        allParams.remove("userName");
        allParams.remove("userFullName");
        allParams.remove("affiliation");
        allParams.remove("userEmail");
        allParams.remove("userPassword");
        allParams.remove("userPasswordConfirm");

        try {
            if (file.createNewFile()) {
                allParams.put("sparqlEndpoint", "http://virtuoso3:8890/sparql");
                allParams.put("graphStoreEndpoint", "http://virtuoso3:8890/sparql-graph-crud-auth/");
                allParams.put("firstLaunch", false);
                allParams.put("version", 1);
                Map<String, String> wor = new HashMap<>();
                wor.put("https://synbiohub.org", "http://localhost:6789");
                allParams.put("webOfRegistries", wor);
                Map<String, Object> themeParams = new HashMap<>();
                themeParams.put("default", allParams.get("color"));
                allParams.put("themeParameters", themeParams);
                allParams.remove("color");
                // TODO: Setup should add a local version to web of registries

                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
                ObjectWriter writer = objectMapper.writerWithDefaultPrettyPrinter();
                String json = writer.writeValueAsString(allParams);
                FileWriter fw = new FileWriter(file.getAbsoluteFile());
                BufferedWriter bw = new BufferedWriter(fw);
                bw.write(json);
                bw.close();
                ConfigUtil.refreshLocalJson();
                log.info("Setup successful!");
                return ResponseEntity.ok("Setup Successful");
            } else {
                log.info("Local file already exists. Setup proceeds.");
                return ResponseEntity.ok("File already exists!");
            }
        } catch (IOException e) {
            log.error("Setup failed.");
            return ResponseEntity.ok("Failed to create file!");
        }
    }

    @GetMapping("/firstLaunched")
    public Boolean checkFirstLaunch() {
        String fileName = "config.local.dup.json";
        String workingDirectory = System.getProperty("user.dir");
        File file = new File(workingDirectory + File.separator + fileName);

        return file.exists();
    }
}
