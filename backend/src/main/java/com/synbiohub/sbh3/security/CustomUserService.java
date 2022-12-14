package com.synbiohub.sbh3.security;

import com.synbiohub.sbh3.dto.UserRegistrationDTO;
import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.exceptions.UserAlreadyExistsException;
import com.synbiohub.sbh3.security.repo.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import javax.naming.AuthenticationException;

@Service
@AllArgsConstructor
public class CustomUserService {

    private final UserRepository userRepository;


    public User registerNewUserAccount(UserRegistrationDTO userRegistrationDTO) throws AuthenticationException {
        // If user already exists, throw an exception
//        if (userRepository.findByEmail(userRegistrationDTO.getEmail()).isPresent()) { throw new UserAlreadyExistsException(); }
        // If the two passwords do not match, throw an exception
        confirmPasswordsMatch(userRegistrationDTO.getPassword1(), userRegistrationDTO.getPassword2());

        var user = new User();
        user.setUsername(userRegistrationDTO.getUsername());
        user.setEmail(userRegistrationDTO.getEmail());
        user.setAffiliation(userRegistrationDTO.getAffiliation());
        user.setName(userRegistrationDTO.getName());

        setEncodedPassword(user, userRegistrationDTO.getPassword1());
        if (userRepository.count() == 0) {
            user.setIsAdmin(true);
            user.setIsCurator(true);
        } else {
            user.setIsAdmin(false);
            user.setIsCurator(false);
        }

        user.setId(1L);


        return userRepository.save(user);
    }

    public void setEncodedPassword(User user, String password) {
        var passwordEncoder = new BCryptPasswordEncoder();
        user.setPassword(passwordEncoder.encode(password));
    }

    public void confirmPasswordsMatch(String password1, String password2) throws AuthenticationException {
        if (password1 == null || !password1.equals(password2)) { throw new AuthenticationException(); }
    }
}
