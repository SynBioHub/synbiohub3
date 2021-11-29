package com.synbiohub.sbh3.controllers.user;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dto.user.UserRegistrationDTO;
import com.synbiohub.sbh3.entities.UserEntity;
import com.synbiohub.sbh3.security.CustomUserService;
import com.synbiohub.sbh3.dto.user.LoginDTO;
import com.synbiohub.sbh3.security.HttpSessionConfig;
import com.synbiohub.sbh3.services.user.UserService;
import com.synbiohub.sbh3.utils.ObjectMapperUtils;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.RequestContextHolder;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import javax.validation.Valid;
import java.util.Map;

@RestController
@AllArgsConstructor
@Slf4j
public class UserController {

    private final CustomUserService customUserService;
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final ObjectMapper mapper;

    @PostMapping(value = "/register")
    public ResponseEntity registerNewUser(@RequestParam Map<String, String> params) {
        try {
            var userRegistrationDTO = ObjectMapperUtils.map(params, UserRegistrationDTO.class);
            customUserService.registerNewUserAccount(userRegistrationDTO);
        } catch (Exception e) {
            log.error("Error creating a new account.");
            e.printStackTrace();
        }
        return new ResponseEntity(HttpStatus.OK);
    }

    @PostMapping(value = "/login")
    public ResponseEntity<String> login(@Valid @RequestBody LoginDTO loginDTO, HttpServletRequest request, HttpServletResponse response) {
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginDTO.getEmail(), loginDTO.getPassword()));
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity(HttpStatus.UNAUTHORIZED);
        }
        var securityContext = SecurityContextHolder.getContext();
        securityContext.setAuthentication(auth);
        request.getSession().setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);
        return ResponseEntity.ok(RequestContextHolder.currentRequestAttributes().getSessionId());
    }

    @GetMapping(value = "/profile", produces = "text/plain")
    public ResponseEntity<String> getProfile() throws JsonProcessingException {
        var user = userService.getUserProfile();
        if (user == null)
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        return ResponseEntity.ok(mapper.writeValueAsString(user));
    }

    @PostMapping(value = "/logout")
    @ResponseStatus(HttpStatus.OK)
    public void logout(HttpSession session) {
        session.invalidate();
    }

}
