package com.synbiohub.sbh3.services;


import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.entities.UserEntity;
import com.synbiohub.sbh3.repositories.UserRepository;
import com.synbiohub.sbh3.sparql.SPARQLQuery;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;

import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    private final SearchService searchService;

    public UserEntity getUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof AnonymousAuthenticationToken) return null;
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
}
