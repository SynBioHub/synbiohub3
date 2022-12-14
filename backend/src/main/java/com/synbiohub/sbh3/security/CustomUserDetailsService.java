package com.synbiohub.sbh3.security;

import com.synbiohub.sbh3.security.repo.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    /**
     * NOTE: This is looking up by email, not username.
     */
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var userCredentials = userRepository.findByEmail(email).get();
        var userDetails = User.builder()
                .username(userCredentials.getUsername())
                .password(userCredentials.getPassword())
                .roles("USER")  //TODO: Change roles based on boolean values in DB
                .build();
        return userDetails;
    }
}
