package com.synbiohub.sbh3.security.config;

import com.synbiohub.sbh3.security.customsecurity.AuthCodeAuthenticationFilter;
import com.synbiohub.sbh3.security.customsecurity.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Note: RSA JwtEncoder/JwtDecoder (Nimbus + app.priv/app.pub) were removed as unused.
 * Live JWTs are HS256 via {@link com.synbiohub.sbh3.security.customsecurity.JwtService} and jwtSecret.
 * Restore encoder/decoder beans if switching to Spring OAuth2 resource-server JWT validation.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final AuthCodeAuthenticationFilter authCodeAuthenticationFilter;
    private final AuthenticationProvider authenticationProvider;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors()
                .and()
                .authorizeHttpRequests()
                .requestMatchers(
                        "/setup", "/login", "/register", "/resetPassword", "/setNewPassword",
                        "/search", "/search/**", "/searchCount", "/searchCount/**",
                        "/download",
                        "/public/**",
                        "/public/**/sbol", "/public/**/sbolnr", "/public/**/gb", "/public/**/gff", "/public/**/fasta", "/public/**/metadata",
                        "/sparql", "/**/count", "/count",
                        "/logo",
                        "/admin/theme", "/admin/registries", "/admin/logo", "/admin/plugins",
                        "/v3/api-docs", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html", "/openapi.yaml",
                        "/error",
                        "/browse", "/rootCollections", "/root-collections", "/callPlugin", "/expose/**", "/getSynBioHubVersion",
                        "/**/twins", "/**/twinsCount", "/**/uses", "/**/usesCount", "/**/similar", "/**/similarCount"
                ).permitAll()
                .anyRequest().authenticated()
                .and()
                .csrf().disable()
                .httpBasic(Customizer.withDefaults())
                .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                .and()
                .authenticationProvider(authenticationProvider)
                .addFilterBefore(authCodeAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3333", "http://localhost:8080"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type", "X-authorization"));
        configuration.setExposedHeaders(List.of("Authorization", "X-authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
