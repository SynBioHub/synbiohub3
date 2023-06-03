package com.synbiohub.sbh3.security.customsecurity;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.print.DocFlavor;
import java.io.IOException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    private final UserDetailsService userDetailsService;

    @Autowired
    private EndpointProperties endpointProperties;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            authHeader = authHeader.split(" ")[1].trim();
        }
        String xauthHeader = request.getHeader("X-authorization");
        final String jwt;
        final String username;
        if (authHeader == null && xauthHeader == null) {
            filterChain.doFilter(request, response);
            return;
        }
        jwt = authHeader == null ? xauthHeader : authHeader;
        username = jwtService.extractUsername(jwt);
        var claim = jwtService.extractAllClaims(jwt);
        List<String> userRoles = convertAuthoritiesToRoles(claim);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        Set<String> allowedEndpoints = new HashSet<>(endpointProperties.getRoleToEndpointPermissions("USER"));
        String requestedEndpoint = request.getRequestURI();
        for (String role : userRoles) {
            allowedEndpoints.addAll(endpointProperties.getRoleToEndpointPermissions(role));
        }
        boolean isEndpointAllowed = false;
        AntPathMatcher pathMatcher = new AntPathMatcher();
        for (String allowedEndpoint : allowedEndpoints) {
            if (pathMatcher.match(allowedEndpoint, requestedEndpoint)) {
                isEndpointAllowed = true;
                break;
            }
        }

        if (!isEndpointAllowed) {
            // User's role does not have the correct permission for the requested endpoint.
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "You don't have the permission to access this resource.");
            return;
        }
        filterChain.doFilter(request, response);

    }

    private List<String> convertAuthoritiesToRoles(Claims claim) {
        List<LinkedHashMap<String, String>> userAuthorities = (List<LinkedHashMap<String, String>>) claim.get("Role");

        List<String> userRoles = new ArrayList<>();
        for (LinkedHashMap<String, String> authority : userAuthorities) {
            String role = authority.values().iterator().next();
            userRoles.add(role);
        }
        return userRoles;
    }
}
