package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dto.UserRegistrationDTO;
import com.synbiohub.sbh3.security.customsecurity.AuthenticationResponse;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.security.repo.AuthRepository;
import com.synbiohub.sbh3.services.UserService;
import com.synbiohub.sbh3.utils.ConfigUtil;
import com.synbiohub.sbh3.utils.RestClient;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;
    private final RestClient restClient;
    private final ObjectMapper mapper;
    private final AuthRepository authRepository;

    @PostMapping(value = "/login", produces = "text/plain")
    public ResponseEntity<String> login(@RequestParam String email, @RequestParam String password) {
        if (email.isEmpty() || password.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Please enter your e-mail address and password.");
        }
        try {
            String username;
            if (userService.isValidEmail(email)) {
                try {
                    username = userService.getUserByEmail(email).getUsername();
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Your e-mail address was not recognized.");
                }
            } else {
                try {
                    username = userService.getUserByUsername(email).getUsername();
                } catch (Exception e) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Please enter a valid email address or username.");
                }
            }
            return ResponseEntity.ok(userService.loginUser(username, password));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Your password was not recognized.");
        }
    }

    /**
     * Logs the current user out of SBH.
     * Endpoint cannot be /logout as this gets intercepted by security configuration and doesn't go through here
     * @param request
     * @return
     * @throws Exception
     */
    @PostMapping(value = "/do_logout")
    public ResponseEntity<String> logout(HttpServletRequest request) throws Exception {
        log.info("Received logout request");
        return ResponseEntity.ok(userService.logoutUser(request));
    }

    @PostMapping(value = "/register")
    public ResponseEntity<String> registerNewUser(@RequestParam String username, @RequestParam String name, @RequestParam String affiliation, @RequestParam String email, @RequestParam String password1, @RequestParam String password2) {
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
            log.error("Error registering a new account.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error registering a new account.");
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

    @GetMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> getProfile(HttpServletRequest request) throws Exception {
        String inputToken = request.getHeader("X-authorization");
        var user = userService.getUserProfile();
        if (user == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error retrieving user profile.");
        return ResponseEntity.ok(mapper.writeValueAsString(user));
    }

    /**
     * Changes user's profile fields.
     * Only updates the fields name, email, and affiliation currently
      */
    @PostMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> updateProfile(@RequestParam Map<String, String> allParams, HttpServletRequest request) throws Exception {
        User updatedUser;
        try {
            String inputToken = request.getHeader("X-authorization");
            updatedUser = userService.updateUserProfile(allParams);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found.");
        }
        User copyUser = (User) updatedUser.clone();
        copyUser.setPassword("");
        log.info(copyUser.toString());
        return ResponseEntity.ok("Profile updated successfully");
    }

    /**
     * First time setup of Synbiohub
     * @param allParams
     * @return
     */
    @PostMapping(value = "/setup")
    public ResponseEntity<String> setup(@RequestBody Map<String, Object> allParams) {
        log.info(String.valueOf(allParams));
        return ResponseEntity.ok(userService.setupInstance(allParams));
    }

    /**
     * Logs out all users from current instance of SBH
     * @return
     */
    @DeleteMapping(value = "/cleanAuthRepo")
    public String cleanAuthRepo() {
        authRepository.deleteAll();
        return "Cleaned.";
    }

    @GetMapping("/firstLaunched")
    public Boolean checkFirstLaunch() {
        return ConfigUtil.isLaunched();
    }

    @GetMapping("/privateUser")
    public String getPrivateUserGraph() throws Exception {
        return ConfigUtil.get("uriPrefix") + "user/" + userService.getUserProfile().getUsername();
    }
}
