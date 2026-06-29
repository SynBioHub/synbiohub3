package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.synbiohub.sbh3.dto.submit.PrepareSubmissionResult;
import com.synbiohub.sbh3.utils.ConfigUtil;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertTrue;

class PrepareSubmissionServiceTest {

    private static final PrepareSubmissionService service = new PrepareSubmissionService();
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @BeforeAll
    static void initConfig() {
        new ConfigUtil();
    }

    @Test
    void run_emptyUpload_producesSbolXml() throws Exception {
        Path empty = Files.createTempFile("sbh-test-empty-", ".tmp");
        empty.toFile().deleteOnExit();

        ObjectNode job = MAPPER.createObjectNode();
        job.put("sbolFilename", empty.toAbsolutePath().toString());
        job.put("submit", true);
        job.put("copy", false);
        job.put("databasePrefix", "https://synbiohub.org/");
        job.put("uriPrefix", "https://synbiohub.org/user/alice/mylib/");
        job.put("requireComplete", false);
        job.put("requireCompliant", false);
        job.put("enforceBestPractices", false);
        job.put("typesInURI", false);
        job.put("version", "1.0");
        job.put("keepGoing", true);
        job.put("topLevelURI", "");
        job.put("rootCollectionIdentity",
                "https://synbiohub.org/user/alice/mylib/mylib_collection/1.0");
        job.put("newRootCollectionDisplayId", "mylib_collection");
        job.put("newRootCollectionVersion", "1.0");
        job.put("ownedByURI", "https://synbiohub.org/user/alice");
        job.put("creatorName", "Alice");
        job.put("name", "Title");
        job.put("description", "Desc");
        job.put("overwrite_merge", "0");
        job.put("shareLinkSalt", "salt");
        job.put("useSBOLExplorer", false);
        job.put("SBOLExplorerEndpoint", "http://localhost:13162/");
        job.put("user", "");
        job.set("webOfRegistries", MAPPER.createObjectNode());
        job.set("citationPubmedIDs", MAPPER.createArrayNode());
        job.set("collectionChoices", MAPPER.createArrayNode());

        PrepareSubmissionResult result = service.run(job);
        assertTrue(result.isSuccess());
        assertTrue(Files.exists(Path.of(result.getResultFilename())));
        assertTrue(Files.size(Path.of(result.getResultFilename())) > 0);
    }
}
