package com.synbiohub.sbh3.security.customsecurity;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    private final UserDetailsService userDetailsService;

    @Autowired
    private EndpointProperties endpointProperties;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        if (PublicBrowsePath.isBrowse(request)) {
            filterChain.doFilter(request, response);
            return;
        }
        String bearerToken = null;
        String rawAuthorization = request.getHeader("Authorization");
        if (rawAuthorization != null && rawAuthorization.regionMatches(true, 0, "Bearer ", 0, 7)) {
            String token = rawAuthorization.substring(7).trim();
            if (!token.isEmpty()) {
                bearerToken = token;
            }
        }
        String xauthHeader = request.getHeader("X-authorization");
        if (xauthHeader != null && xauthHeader.isBlank()) {
            xauthHeader = null;
        }
        if (bearerToken == null && xauthHeader == null) {
            filterChain.doFilter(request, response);
            return;
        }
        final String jwt = bearerToken != null ? bearerToken : xauthHeader;
        if (jwt == null || jwt.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        final String username;
        final List<String> userRoles;
        try {
            username = jwtService.extractUsername(jwt);
            var claim = jwtService.extractAllClaims(jwt);
            userRoles = convertAuthoritiesToRoles(claim);
        } catch (RuntimeException e) {
            // Not a JWT or bad signature — continue anonymously; Spring Security still enforces auth on protected routes.
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                SecurityContextHolder.clearContext();
            }
            filterChain.doFilter(request, response);
            return;
        }

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
        String requestedEndpoint = ServletPathUtil.getPathWithinApplication(request);
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
