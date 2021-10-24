package com.synbiohub.sbh3.security;

import com.synbiohub.sbh3.dto.user.UserRegistrationDTO;
import com.synbiohub.sbh3.entities.UserEntity;
import com.synbiohub.sbh3.exceptions.UserAlreadyExistsException;
import com.synbiohub.sbh3.repositories.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.naming.AuthenticationException;

@Service
@AllArgsConstructor
public class CustomUserService {

    private final UserRepository userRepository;


    public UserEntity registerNewUserAccount(UserRegistrationDTO userRegistrationDTO) throws AuthenticationException {
        // If user already exists, throw an exception
        if (userRepository.findByEmail(userRegistrationDTO.getEmail()).isPresent()) { throw new UserAlreadyExistsException(); }
        // If the two passwords do not match, throw an exception
        if (!userRegistrationDTO.getPassword1().equals(userRegistrationDTO.getPassword2())) { throw new AuthenticationException(); }

        var user = new UserEntity();
        user.setUsername(userRegistrationDTO.getUsername());
        user.setEmail(userRegistrationDTO.getEmail());
        user.setAffiliation(userRegistrationDTO.getAffiliation());
        user.setName(userRegistrationDTO.getName());

        var passwordEncoder = new BCryptPasswordEncoder();
        user.setPassword(passwordEncoder.encode(userRegistrationDTO.getPassword1()));

        user.setIsAdmin(false);
        user.setIsCurator(false);

        return userRepository.save(user);
    }
}
