package com.synbiohub.sbh3.security;

import lombok.AllArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;


@EnableWebSecurity
@AllArgsConstructor
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    private final CustomUserDetailsService customUserDetailsService;

    /**
     * Handles authentication
     * @param auth
     * @throws Exception
     */
    @Override
    protected void configure(AuthenticationManagerBuilder auth) {
        // Check if the username and (salted) password match with the object returned from H2
        auth.authenticationProvider(daoAuthenticationProvider());
    }

    /**
     * Configure authorization for any web endpoints
     * @param http
     * @throws Exception
     */
    @Override
    protected void configure(HttpSecurity http) throws Exception {
        // Note: Place most restrictive roles at the top of the method chain

        http
                .authorizeRequests()
                .antMatchers(
                        HttpMethod.POST,
                        "/login",
                        "/logout"
                ).permitAll()
//                .antMatchers("/admin/*").hasRole("ADMIN")
                .antMatchers("/h2-console/*").permitAll()

                // Make H2-Console non-secured; for debug purposes
                .and()
                    .csrf().ignoringAntMatchers("/h2-console/**")

                // Allow pages to be loaded in frames from
                // the same origin; needed for H2-Console
                .and()
                    .headers().frameOptions().sameOrigin()

                .and()
                    .csrf().disable();

        http.logout(logout -> logout
                .logoutUrl("/logout")
                .logoutSuccessUrl("/")
                .invalidateHttpSession(true)
        );
    }

    @Bean()
    @Override
    public AuthenticationManager authenticationManagerBean() throws Exception {
        return super.authenticationManagerBean();
    }

    public PasswordEncoder getPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

    public AuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider();
        provider.setPasswordEncoder(getPasswordEncoder());
        provider.setUserDetailsService(customUserDetailsService);
        return provider;
    }

}
