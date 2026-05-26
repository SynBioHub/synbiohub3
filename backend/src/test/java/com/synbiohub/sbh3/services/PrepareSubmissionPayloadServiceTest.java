package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitCreatedBy;
import com.synbiohub.sbh3.utils.ConfigUtil;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PrepareSubmissionPayloadServiceTest {

    private static final PrepareSubmissionPayloadService service = new PrepareSubmissionPayloadService();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @BeforeAll
    static void initConfig() {
        new ConfigUtil();
    }

    private static SanitizedSubmitPayload sample() {
        return SanitizedSubmitPayload.builder()
                .id("mylib")
                .name("N")
                .description("D")
                .version("1.0")
                .citations("")
                .overwriteMerge("0")
                .plugin("default")
                .collectionUri("https://synbiohub.org/user/alice%40lab/mylib/mylib_collection/1.0")
                .collectionId("mylib_collection")
                .citationArray(List.of(10, 20))
                .uploadedFilePath("/tmp/upload.sbol")
                .createdBy(SubmitCreatedBy.builder()
                        .username("alice@lab")
                        .fullName("Alice L")
                        .email("a@b.c")
                        .graphUri("https://synbiohub.org/user/alice%40lab")
                        .build())
                .collectionExists(false)
                .existingCollection(null)
                .build();
    }

    @Test
    void build_setsSbolFilenameForceSubmitAndDerivedUris() throws Exception {
        JsonNode j = service.buildPrepareSubmissionJson(sample(), null, "Bearer test-token");
        assertEquals("/tmp/upload.sbol", j.path("sbolFilename").asText());
        assertTrue(j.path("forceSubmit").asBoolean());
        assertEquals("Bearer test-token", j.path("user").asText());
        assertEquals("0", j.path("overwrite_merge").asText());
        assertTrue(j.path("collectionChoices").isArray());
        assertEquals(0, j.path("collectionChoices").size());
        assertEquals(2, j.path("citationPubmedIDs").size());
        assertEquals(10, j.path("citationPubmedIDs").get(0).asInt());
        assertEquals(
                "https://synbiohub.org/user/alice%40lab/mylib/mylib_collection/1.0",
                j.path("rootCollectionIdentity").asText());
        assertEquals(j.path("collectionUri").asText(), j.path("rootCollectionIdentity").asText());
        assertEquals("https://synbiohub.org/user/alice@lab", j.path("ownedByURI").asText());
        assertEquals("Alice L", j.path("creatorName").asText());
        assertTrue(j.path("uriPrefix").asText().contains("/user/alice%40lab/mylib/"));
    }

    @Test
    void build_callerOverridesWin() throws Exception {
        ObjectNode over = MAPPER.createObjectNode();
        over.put("overwrite_merge", "3");
        over.put("forceSubmit", false);
        JsonNode j = service.buildPrepareSubmissionJson(sample(), over, null);
        assertEquals("3", j.path("overwrite_merge").asText());
        assertTrue(!j.path("forceSubmit").asBoolean());
    }

    @Test
    void build_deepMergesNestedObjects() throws Exception {
        ObjectNode over = MAPPER.createObjectNode();
        ObjectNode wor = MAPPER.createObjectNode();
        wor.put("http://registry.example/", "https://peer.example/");
        over.set("webOfRegistries", wor);
        JsonNode j = service.buildPrepareSubmissionJson(sample(), over, null);
        assertEquals("https://peer.example/", j.path("webOfRegistries").path("http://registry.example/").asText());
    }
}
