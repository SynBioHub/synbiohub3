package com.synbiohub.sbh3.controllers.user;

import com.synbiohub.sbh3.dto.user.UserRegistrationDTO;
import com.synbiohub.sbh3.security.CustomUserService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;

@RestController
@AllArgsConstructor
@Slf4j
public class UserController {

    private final CustomUserService customUserService;


    @PostMapping(value = "/register")
    public void registerNewUser(@Valid @RequestBody UserRegistrationDTO userRegistrationDTO) {
        try {
            customUserService.registerNewUserAccount(userRegistrationDTO);
        } catch (Exception e) {
            log.error("Error creating a new account.");
            e.printStackTrace();
        }
    }

}
