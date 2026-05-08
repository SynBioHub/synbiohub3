package com.synbiohub.sbh3.security.customsecurity;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.utils.ConfigUtil;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    public static final String CLAIM_PURPOSE = "purpose";
    public static final String PURPOSE_PASSWORD_RESET = "PASSWORD_RESET";

    /** Password-reset links remain valid for 24 hours (login JWTs stay at 1 hour). */
    private static final long PASSWORD_RESET_EXPIRY_MS = 1000L * 60 * 60 * 24;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        extraClaims.put("Role", userDetails.getAuthorities());
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + (1000 * 60 * 60))) // Tokens last for 1 hour
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * JWT for email password-reset links. Not usable as a session token (no {@code Role} claim; filter ignores it).
     */
    public String generatePasswordResetToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_PURPOSE, PURPOSE_PASSWORD_RESET);
        return Jwts
                .builder()
                .setClaims(claims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + PASSWORD_RESET_EXPIRY_MS))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Validates signature, expiry, and {@value #PURPOSE_PASSWORD_RESET} claim; returns the username (subject).
     */
    public String validatePasswordResetTokenAndGetUsername(String token) {
        Claims claims = extractAllClaims(token);
        Object purpose = claims.get(CLAIM_PURPOSE);
        if (!PURPOSE_PASSWORD_RESET.equals(purpose)) {
            throw new IllegalArgumentException("Invalid reset token");
        }
        String subject = claims.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new IllegalArgumentException("Invalid reset token");
        }
        return subject;
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date(System.currentTimeMillis()));
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        String jwtSecret = null;
        try {
            JsonNode secretNode = ConfigUtil.get("jwtSecret");
            if (secretNode != null && !secretNode.isNull()) {
                jwtSecret = secretNode.asText();
            }
        } catch (IOException ignored) {
            // Error handling below reports a clear startup/runtime message.
        }

        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException("JWT secret missing. Run setup to create data/config.local.json with jwtSecret.");
        }

        byte[] keyBytes;
        try {
            keyBytes = Decoders.BASE64.decode(jwtSecret);
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("Invalid jwtSecret format in config.local.json. Expected Base64.", e);
        }

        if (keyBytes.length < 32) {
            throw new IllegalStateException("Invalid jwtSecret length in config.local.json. Must decode to at least 32 bytes.");
        }

        return Keys.hmacShaKeyFor(keyBytes);
    }

}
