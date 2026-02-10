package com.synbiohub.sbh3.security.customsecurity;

import com.synbiohub.sbh3.security.model.AuthCodes;
import com.synbiohub.sbh3.security.repo.AuthRepository;
import com.synbiohub.sbh3.security.repo.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class AuthCodeAuthenticationFilter extends OncePerRequestFilter {

    private final AuthRepository authRepository;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        final String authCode = request.getHeader("X-authorization");

        if (authCode == null || authCode.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // check if this JWT Session exists in the lookup table
        Optional<AuthCodes> storedMapping = authRepository.findByAuth(authCode);

        if (storedMapping.isPresent()) {
            // Use the username stored in the table to get the FRESH DB user
            // Even if the JWT inside 'authCode' has an old email,
            // the SQL DB has the current one.
            String username = storedMapping.get().getName();

            userRepository.findByUsername(username).ifPresent(user -> {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        user, // The 'user' object here is the fresh one from the DB
                        null,
                        user.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set the context. Now UserController/UserService can just
                // grab the user from the SecurityContext and they'll get the fresh data.
                SecurityContextHolder.getContext().setAuthentication(authToken);
            });

            filterChain.doFilter(request, response);
        } else {
            SecurityContextHolder.clearContext();
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("text/plain");
            response.getWriter().write("Invalid or expired session. Please log in again.");
        }

    }
}

