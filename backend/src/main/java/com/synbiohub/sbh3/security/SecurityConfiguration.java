package com.synbiohub.sbh3.security;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.codec.Utf8;
import org.springframework.security.crypto.password.MessageDigestPasswordEncoder;

import javax.xml.bind.annotation.adapters.HexBinaryAdapter;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;


@EnableWebSecurity
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    // Singleton config file object
    @Autowired
    JsonNode config;

    @Autowired
    private CustomUserDetailService customUserDetailService;
    /**
     * Handles authentication
     * @param auth
     * @throws Exception
     */
    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        // Check if the username and (salted) password match with the object returned from SQLite
        auth.userDetailsService(customUserDetailService).passwordEncoder(getPasswordEncoder());
    }

    /**
     * Configure authorization for any web endpoints
     * @param http
     * @throws Exception
     */
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        // Note: Place most restrictive roles at the top of the method chain

        http.authorizeRequests()
                .antMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
                .and()
                .formLogin();

        http.logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
        );
    }

    /**
     * Get an instance of the SHA-1 Password Encoder
     * @return Instance of SHA-1 MessageDigestPasswordEncoder()
     */
    @Bean
    public MessageDigestPasswordEncoder getPasswordEncoder() {
        return new MessageDigestPasswordEncoder("SHA-1") {
            /**
             * Follows the formula hashedPassword = SHA1(config.get("passwordSalt") + SHA1(rawPassword))
             * @param rawPassword Raw password from user
             * @return Salted SHA-1 hashed password
             */
            @Override
            public String encode(CharSequence rawPassword) {
                MessageDigest md = null;
                ByteArrayOutputStream baos = new ByteArrayOutputStream();

                try {
                    md = MessageDigest.getInstance("SHA-1");
                    String salt = config.get("passwordSalt").asText();
                    byte[] hashedPw = md.digest(rawPassword.toString().getBytes(StandardCharsets.UTF_8));

                    baos.write(salt.getBytes(StandardCharsets.UTF_8));
                    baos.write(new HexBinaryAdapter().marshal(hashedPw).toLowerCase().getBytes(StandardCharsets.UTF_8));
                } catch (Exception e) {
                    e.printStackTrace();
                }
                byte[] fullPassUnHashed = baos.toByteArray();
                byte[] fullPassHashed = md.digest(fullPassUnHashed);
                return (new HexBinaryAdapter()).marshal(fullPassHashed);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                String expected = this.encode(rawPassword).toLowerCase();
                return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), encodedPassword.getBytes(StandardCharsets.UTF_8));
            }
        };
    }
}
