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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;
    private final RestClient restClient;
    private final ObjectMapper mapper;
    private final AuthRepository authRepository;
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);


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

    @PostMapping(value = "/resetPassword")
    public ResponseEntity<String> resetPassword(@RequestParam Map<String, String> allParams) {
        String email = allParams.getOrDefault("email", "").trim();
        if (email.isEmpty() || !userService.isValidEmail(email)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Please enter a valid email address.");
        }

        String genericMessage = "If an account exists for that email, a password reset link has been sent.";
        try {
            User user = userService.getUserByEmail(email);
            if (user == null) {
                return ResponseEntity.ok(genericMessage);
            }

            String token = userService.generatePasswordResetTokenForUsername(user.getUsername());
            if (token == null || token.isBlank()) {
                return ResponseEntity.ok(genericMessage);
            }

            var mailConfig = ConfigUtil.get("mail");
            String configuredApiKey = mailConfig != null ? mailConfig.path("sendgridApiKey").asText("").trim() : "";
            String resendConfigApiKey = mailConfig != null ? mailConfig.path("resendApiKey").asText("").trim() : "";
            String mailApiKey = System.getenv("RESEND_API_KEY");
            if (mailApiKey == null || mailApiKey.isBlank()) {
                mailApiKey = System.getenv("SENDGRID_API_KEY");
            }
            if (mailApiKey == null || mailApiKey.isBlank()) {
                mailApiKey = !resendConfigApiKey.isEmpty() ? resendConfigApiKey : configuredApiKey;
            }
            String fromAddress = mailConfig != null ? mailConfig.path("fromAddress").asText("").trim() : "";
            if (mailApiKey.isEmpty() || fromAddress.isEmpty()) {
                logger.error("Cannot send password reset email: mail config is missing API key or fromAddress.");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body("Mail settings are not configured.");
            }

            sendPasswordResetEmail(mailApiKey, fromAddress, email, token);
            return ResponseEntity.ok(genericMessage);
        } catch (Exception e) {
            logger.error("Failed to send password reset email for {}: {}", email, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to send reset email at this time.");
        }
    }

    private void sendPasswordResetEmail(String apiKey, String fromAddress, String toAddress, String token)
            throws IOException {
        String resetLink = buildResetPasswordLink(token);
        String body = "A request was made to reset your SynBioHub password.\n\n"
                + "Use the following link to set a new password:\n"
                + resetLink + "\n\n"
                + "If you did not request this change, you can ignore this email.";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> payload = new HashMap<>();
        payload.put("from", fromAddress);
        payload.put("to", List.of(toAddress));
        payload.put("subject", "SynBioHub password reset");
        payload.put("text", body);

        ResponseEntity<?> response = restClient.post("https://api.resend.com/emails", payload, String.class, headers);
        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IOException("Resend rejected password reset email with status " + response.getStatusCode().value());
        }
    }

    private String buildResetPasswordLink(String token) throws IOException {
        String instanceUrl = ConfigUtil.get("instanceUrl").asText("").trim();
        if (instanceUrl.endsWith("/")) {
            instanceUrl = instanceUrl.substring(0, instanceUrl.length() - 1);
        }
        if (instanceUrl.isEmpty()) {
            instanceUrl = "http://localhost:3000";
        }
        return instanceUrl + "/change-password?token="
                + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }
    /**
     * @param token      JWT from password-reset email (claim {@code purpose=PASSWORD_RESET})
     * @param password1  new password
     * @param password2  confirmation; must match {@code password1}
     */
    @PostMapping(value = "/setNewPassword")
    public ResponseEntity<String> setNewPassword(
            @RequestParam String token,
            @RequestParam String password1,
            @RequestParam String password2) {
        try {
            userService.setNewPasswordWithToken(token, password1, password2);
            return ResponseEntity.ok("Password updated successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.warn("setNewPassword failed: {}", e.toString());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired reset link.");
        }
    }

    @GetMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> getProfile(HttpServletRequest request) throws Exception {
    // from testing 1/20
        User user = userService.getUserProfile();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error retrieving user profile.");
        }
        // Remove password before sending
        user.setPassword("");
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
