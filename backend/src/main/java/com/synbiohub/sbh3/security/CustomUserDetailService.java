package com.synbiohub.sbh3.security;

import com.synbiohub.sbh3.sqlite.Role;
import com.synbiohub.sbh3.sqlite.User;
import com.synbiohub.sbh3.sqlite.UserRowMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.User.UserBuilder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class CustomUserDetailService implements UserDetailsService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Returns a user's password given their username
     * This method is used at login time to check whether the inputted password matches with what is in the DB
     * @param username The username
     * @return The user's details
     * @throws UsernameNotFoundException If there is no such user with that username
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = jdbcTemplate.queryForObject("SELECT * FROM user WHERE username = ?",
                        new Object[] {username},
                        new UserRowMapper());

        if (user == null) {
            throw new UsernameNotFoundException(username);
        }

        UserBuilder builder = org.springframework.security.core.userdetails.User.withUsername(username);
        builder.password(user.getPassword());
        builder.authorities(this.buildUserAuthority(user.getRoles()));   // Get roles of user

        return builder.build();
    }

    /**
     * Gets the allowed authorities of a user
     * @param userRoles Roles of a user
     * @return Authorities within a GrantedAuthority list
     */
    private List<GrantedAuthority> buildUserAuthority(Set<Role> userRoles) {

        Set<GrantedAuthority> setAuths = new HashSet<>();

        // add user's Roles
        for (Role userRole: userRoles) {
            setAuths.add(new SimpleGrantedAuthority("ROLE_" + userRole.toString()));
        }

        List<GrantedAuthority> Result = new ArrayList<>(setAuths);

        return Result;
    }

}
