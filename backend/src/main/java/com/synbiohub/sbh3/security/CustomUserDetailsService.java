package com.synbiohub.sbh3.security;

import com.synbiohub.sbh3.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        var userCredentials = userRepository.findByUsername(username).get();
        var userDetails = User.builder()
                .username(userCredentials.getUsername())
                .password(userCredentials.getPassword())
                .roles("USER")  //TODO: Change roles based on boolean values in DB
                .build();
        return userDetails;
    }
}
