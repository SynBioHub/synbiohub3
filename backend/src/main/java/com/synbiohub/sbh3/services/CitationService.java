package com.synbiohub.sbh3.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CitationService {

    public List<Integer> parseCitationPubmedIds(String citations) {
        if (citations == null || citations.isBlank()) {
            return new ArrayList<>();
        }
        return Arrays.stream(citations.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try {
                        return Integer.parseInt(s);
                    } catch (NumberFormatException e) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Invalid citation (expected PubMed ID): " + s);
                    }
                })
                .collect(Collectors.toList());
    }
}
