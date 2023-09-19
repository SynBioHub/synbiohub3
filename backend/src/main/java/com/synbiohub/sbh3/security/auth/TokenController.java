package com.synbiohub.sbh3.security.auth;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.stream.Collectors;

//@RestController
//@AllArgsConstructor
//@Slf4j
public class TokenController {

//    @Autowired
//    JwtEncoder encoder;
//
//    @PostMapping("/token")
//    public String token(Authentication authentication, @RequestHeader HttpHeaders headers) {
//        Instant now = Instant.now();
//        long expiration = 600L;  //10 minutes?
//        String scope = authentication.getAuthorities().stream()
//                .map(GrantedAuthority::getAuthority)
//                .collect(Collectors.joining(" "));
//        JwtClaimsSet claims = JwtClaimsSet.builder()
//                .issuer("self")
//                .issuedAt(now)
//                .expiresAt(now.plusSeconds(expiration))
//                .subject(authentication.getName())
//                .claim("scope", scope)
//                .build();
//        return this.encoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
//    }

}
