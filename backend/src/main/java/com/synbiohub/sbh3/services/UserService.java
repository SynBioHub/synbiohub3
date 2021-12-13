package com.synbiohub.sbh3.services;


import com.synbiohub.sbh3.entities.UserEntity;
import com.synbiohub.sbh3.repositories.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@AllArgsConstructor
public class UserService {
    private final UserRepository userRepository;

    public UserEntity getUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof AnonymousAuthenticationToken) return null;
        var user = userRepository.findByUsername(authentication.getName());
        if (user.isEmpty())
            return null;

        var userGet = user.get();
        userGet.setPassword("");
        return userGet;

    }
}
