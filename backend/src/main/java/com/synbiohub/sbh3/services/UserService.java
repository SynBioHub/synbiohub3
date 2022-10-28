package com.synbiohub.sbh3.services;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.entities.UserEntity;
import com.synbiohub.sbh3.repositories.UserRepository;
import com.synbiohub.sbh3.security.CustomUserService;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;

import javax.naming.AuthenticationException;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private final SearchService searchService;

    private final CustomUserService customUserService;

    public UserEntity getUserProfile() {
        Authentication authentication = checkAuthentication();
        var user = userRepository.findByUsername(authentication.getName());
        if (user.isEmpty())
            return null;

        var userGet = user.get();
        userGet.setPassword("");
        return userGet;

    }

    /**
     * Compares the user's X-authorization token to the one passed in
     * @param xauth X-authorization token passed in from HTTP header
     * @return True if the tokens are the same, false otherwise.
     */
    public Boolean validateXAuth(String xauth) {
        return RequestContextHolder.currentRequestAttributes().getSessionId().equals(xauth);
    }

    /**
     * Compares a part to see if it matches a user's graph.
     * The user's graph is the default graph + "/user" + their username.
     * @return True if it matches, false otherwise.
     */
    public Boolean isOwnedBy(String topLevelUri) {
        SPARQLQuery query = new SPARQLQuery("src/main/java/com/synbiohub/sbh3/sparql/GetOwnedBy.sparql");
        String results = searchService.SPARQLQuery(query.loadTemplate(Collections.singletonMap("topLevel", topLevelUri)));
        ArrayList<String> owners = new ArrayList<>();
        try {
            var mapper = new ObjectMapper();
            JsonNode rawTree = mapper.readTree(results);
            for(JsonNode node : rawTree.get("results").get("bindings")) {
                for (Iterator<Map.Entry<String, JsonNode>> it = node.fields(); it.hasNext(); ) {
                    Map.Entry<String, JsonNode> subNode = it.next();
                    owners.add(subNode.getValue().get("value").asText());
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return owners.contains(ConfigUtil.get("triplestore").get("graphPrefix").asText() + "user/" + SecurityContextHolder.getContext().getAuthentication().getName());
    }

    public ResponseEntity<String> updateUser(ObjectMapper mapper, Map<String, String> allParams) throws JsonProcessingException, AuthenticationException {
        Authentication auth = checkValidLogin(authentication -> authentication, allParams.get("email"), allParams.get("password1"));
        customUserService.confirmPasswordsMatch(allParams.get("password1"), allParams.get("password2"));
        UserEntity user = getUserProfile();
        if (user == null || auth == null)
            return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
        updateUserFields(user, allParams);
        userRepository.save(user);
        user.setPassword("");
        return ResponseEntity.ok(mapper.writeValueAsString(user));
    }

    private void updateUserFields(UserEntity user, Map<String, String> allParams) {
        if (allParams.get("name") != null) {
            user.setName(allParams.get("name"));
        }
        if (allParams.get("email") != null) {
            user.setEmail(allParams.get("email"));
        }
        if (allParams.get("affiliation") != null) {
            user.setAffiliation(allParams.get("affiliation"));
        }
        if (allParams.get("password1") != null) {
            customUserService.setEncodedPassword(user, allParams.get("password1"));
        }
    }

    private Authentication checkAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof AnonymousAuthenticationToken) return null;
        return authentication;
    }

    public Authentication checkValidLogin(AuthenticationManager authenticationManager, String email, String password) {
        Authentication auth;
        try {
            auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));
        } catch (Exception e) {
            return null;
        }
        return auth;
    }

}
