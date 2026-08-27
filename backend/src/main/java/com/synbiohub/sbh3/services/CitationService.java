package com.synbiohub.sbh3.services;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class CitationService {

    private static final Pattern CITATIONS_FORMAT = Pattern.compile("^[0-9]+(,[0-9]*)*$");

    public List<Integer> parseCitationPubmedIds(String citations) {
        if (citations == null || citations.isBlank()) {
            return new ArrayList<>();
        }
        String trimmed = citations.trim();
        if (!CITATIONS_FORMAT.matcher(trimmed).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Citations must be comma-separated PubMed IDs");
        }
        return Arrays.stream(trimmed.split(","))
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
