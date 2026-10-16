package com.synbiohub.sbh3.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dto.UserRegistrationDTO;
import com.synbiohub.sbh3.security.model.Role;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.services.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@Tag(name = "Auth & Users", description = "Authentication, registration, and user management")
@RequiredArgsConstructor
@Slf4j
public class UserController {
    private final UserService userService;
    private final ObjectMapper mapper;
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Operation(summary = "Login", description = "Authenticate a user with email or username and password.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JWT token returned as plain text"),
            @ApiResponse(responseCode = "400", description = "Invalid email/username"),
            @ApiResponse(responseCode = "401", description = "Invalid credentials or empty fields")
    })
    @PostMapping(value = "/login", produces = "text/plain")
    public ResponseEntity<String> login(@Parameter(description = "User's email or username") @RequestParam String email,
            @Parameter(description = "User's password") @RequestParam String password) {
        return ResponseEntity.ok(userService.login(email, password));
    }

    @Operation(summary = "Register new user", description = "Creates a new user account and returns a JWT token upon successful registration.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "JWT token for the newly registered user"),
            @ApiResponse(responseCode = "400", description = "Error registering a new account")
    })
    @PostMapping(value = "/register")
    public ResponseEntity<String> registerNewUser(
            @Parameter(description = "Unique username") @RequestParam String username,
            @Parameter(description = "Full display name") @RequestParam String name,
            @Parameter(description = "Institutional affiliation") @RequestParam String affiliation,
            @Parameter(description = "Email address") @RequestParam String email,
            @Parameter(description = "Password") @RequestParam String password1,
            @Parameter(description = "Password confirmation") @RequestParam String password2) {
        log.info("Registering a new user.");
        UserRegistrationDTO userRegistrationDTO = UserRegistrationDTO
                .builder()
                .username(username)
                .name(name)
                .affiliation(affiliation)
                .email(email)
                .password1(password1)
                .password2(password2)
                .role(Role.USER)
                .build();
        return ResponseEntity.ok(userService.register(userRegistrationDTO));
    }

    @Operation(summary = "Request password reset (Dead Code)", description = "This endpoint is not wired to the frontend.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Reset email sent or acknowledgement"),
            @ApiResponse(responseCode = "400", description = "Invalid or missing email"),
            @ApiResponse(responseCode = "500", description = "Server error sending email")
    })
    @PostMapping(value = "/resetPassword")
    public ResponseEntity<String> resetPassword(
            @Parameter(description = "Map containing the 'email' key") @RequestParam Map<String, String> allParams) {
        try {
            String email = allParams.getOrDefault("email", "").trim();
            return ResponseEntity.ok(userService.requestPasswordReset(email));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.error("resetPassword failed: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unable to send reset email at this time.");
        }
    }

    /**
     * @param token     JWT from password-reset email (claim
     *                  {@code purpose=PASSWORD_RESET})
     * @param password1 new password
     * @param password2 confirmation; must match {@code password1}
     */
    @Operation(summary = "Set new password", description = "Sets a new password using a reset token received via email.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Password updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid token, expired link, or password mismatch")
    })
    @PostMapping(value = "/setNewPassword")
    public ResponseEntity<String> setNewPassword(
            @Parameter(description = "JWT reset token") @RequestParam String token,
            @Parameter(description = "New password") @RequestParam String password1,
            @Parameter(description = "New password confirmation") @RequestParam String password2) {
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

    @Operation(summary = "Get user profile", description = "Returns the authenticated user's profile information.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User profile JSON"),
            @ApiResponse(responseCode = "401", description = "Error retrieving user profile")
    })
    @PreAuthorize("hasAnyAuthority('USER', 'CURATOR', 'ADMIN')")
    @GetMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> getProfile(HttpServletRequest request) throws Exception {
        User user = userService.getUserProfile();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Error retrieving user profile.");
        }
        user.setPassword("");
        return ResponseEntity.ok(mapper.writeValueAsString(user));
    }

    /**
     * Changes user's profile fields.
     * Only updates the fields name, email, and affiliation currently
     */
    @Operation(summary = "Update user profile", description = "Updates the authenticated user's profile fields.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Profile updated successfully"),
            @ApiResponse(responseCode = "401", description = "User not found")
    })
    @PreAuthorize("hasAnyAuthority('USER', 'CURATOR', 'ADMIN')")
    @PostMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> updateProfile(
            @Parameter(description = "Map of fields to update") @RequestParam Map<String, String> allParams,
            HttpServletRequest request) throws Exception {
        User updatedUser;
        try {
            updatedUser = userService.updateUserProfile(allParams);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found.");
        }
        User copyUser = (User) updatedUser.clone();
        copyUser.setPassword("");
        log.info(copyUser.toString());
        return ResponseEntity.ok("Profile updated successfully");
    }

    @Operation(summary = "Setup instance", description = "First time setup of the SynBioHub instance. Creates initial admin user and configuration.")
    @ApiResponse(responseCode = "200", description = "Instance setup complete")
    @PostMapping(value = "/setup")
    public ResponseEntity<String> setup(
            @Parameter(description = "Instance configuration properties") @RequestBody Map<String, Object> allParams) {
        log.info(String.valueOf(allParams));
        return ResponseEntity.ok(userService.setupInstance(allParams));
    }

    @GetMapping("/getSynBioHubVersion")
    public ResponseEntity<Integer> getSynBioHubVersion() throws IOException {
        return ResponseEntity.ok(userService.getSynBioHubVersion());
    }
}
