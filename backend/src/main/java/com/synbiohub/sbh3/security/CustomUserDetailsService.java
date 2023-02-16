package com.synbiohub.sbh3.security;

import com.synbiohub.sbh3.security.model.User;
import com.synbiohub.sbh3.security.repo.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) {
        return userRepository.findByUsername(username).map(u -> CustomUserDetails.builder()
                .username(u.getUsername())
                .password(u.getPassword())
                .credentialsNonExpired(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .enabled(true)
                .authorities(List.of(new SimpleGrantedAuthority(u.getRole().name())))
                .build())
                .orElseThrow();
    }
}
