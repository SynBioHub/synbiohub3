package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.dto.submit.PrepareSubmissionFailedException;
import com.synbiohub.sbh3.dto.submit.PrepareSubmissionResult;
import com.synbiohub.sbh3.submit.PrepareSubmissionJob;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

/**
 * Runs {@link PrepareSubmissionJob} in-process from the JSON payload built by {@link PrepareSubmissionPayloadService}.
 */
@Service
public class PrepareSubmissionService {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public PrepareSubmissionResult run(JsonNode prepareJson) throws Exception {
        PrepareSubmissionJob job = MAPPER.convertValue(prepareJson, PrepareSubmissionJob.class);
        job.webOfRegistries = readWebOfRegistries(prepareJson.path("webOfRegistries"));
        job.citationPubmedIDs = readCitationPubmedIds(prepareJson.path("citationPubmedIDs"));
        job.collectionChoices = readStringList(prepareJson.path("collectionChoices"));
        PrepareSubmissionResult result = job.execute();
        if (!result.isSuccess()) {
            throw new PrepareSubmissionFailedException(result);
        }
        return result;
    }

    private static HashMap<String, String> readWebOfRegistries(JsonNode node) {
        HashMap<String, String> map = new HashMap<>();
        if (node == null || !node.isObject()) {
            return map;
        }
        Iterator<Map.Entry<String, JsonNode>> it = node.fields();
        while (it.hasNext()) {
            Map.Entry<String, JsonNode> e = it.next();
            map.put(e.getKey(), e.getValue().asText(""));
        }
        return map;
    }

    private static ArrayList<String> readCitationPubmedIds(JsonNode node) {
        ArrayList<String> out = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return out;
        }
        for (JsonNode item : node) {
            if (item.isNumber()) {
                out.add(String.valueOf(item.asInt()));
            } else {
                out.add(item.asText(""));
            }
        }
        return out;
    }

    private static ArrayList<String> readStringList(JsonNode node) {
        ArrayList<String> out = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return out;
        }
        for (JsonNode item : node) {
            out.add(item.asText(""));
        }
        return out;
    }
}
