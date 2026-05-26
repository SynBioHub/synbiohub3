package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitConflictException;
import com.synbiohub.sbh3.dto.submit.SubmitCreatedBy;
import com.synbiohub.sbh3.dto.submit.SubmitRootCollectionMetadata;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SubmitPostMetadataServiceTest {

    private final SubmitPostMetadataService service = new SubmitPostMetadataService();

    private static SanitizedSubmitPayload base(String om) {
        return SanitizedSubmitPayload.builder()
                .id("form_id")
                .name("Form name")
                .description("Form desc")
                .version("9")
                .citations("")
                .overwriteMerge(om)
                .plugin("default")
                .collectionUri("https://ex/user/alice/lib/lib_collection/1")
                .collectionId("lib_collection")
                .citationArray(List.of())
                .uploadedFilePath("/tmp/x")
                .createdBy(SubmitCreatedBy.builder()
                        .username("alice")
                        .fullName("A")
                        .email("a@b.c")
                        .graphUri("https://ex/user/alice")
                        .build())
                .collectionExists(false)
                .existingCollection(null)
                .build();
    }

    @Test
    void noMetadata_merge_errors() {
        SubmitConflictException ex = assertThrows(
                SubmitConflictException.class,
                () -> service.applyLegacyMetadataRules(base("2"), Optional.empty()));
        assertEquals("Submission id and version do not exist", ex.getMessage());
        assertThrows(SubmitConflictException.class, () -> service.applyLegacyMetadataRules(base("3"), Optional.empty()));
    }

    @Test
    void noMetadata_new_coercesOverwriteMergeTo0() {
        SanitizedSubmitPayload out = service.applyLegacyMetadataRules(base("0"), Optional.empty());
        assertEquals("0", out.getOverwriteMerge());
        assertTrue(out.getName().contains("Form"));
        assertEquals(false, out.isCollectionExists());
    }

    @Test
    void noMetadata_overwrite_coercesTo0() {
        SanitizedSubmitPayload out = service.applyLegacyMetadataRules(base("1"), Optional.empty());
        assertEquals("0", out.getOverwriteMerge());
    }

    @Test
    void hasMetadata_merge_updatesFromMetadata_firstCollectionSuffixOnly() {
        SubmitRootCollectionMetadata meta = SubmitRootCollectionMetadata.builder()
                .displayId("mylib_collection_extra_collection")
                .version("2.0")
                .name("Store title")
                .description("Store body")
                .build();
        SanitizedSubmitPayload out = service.applyLegacyMetadataRules(base("3"), Optional.of(meta));
        assertEquals("mylib_extra_collection", out.getId());
        assertEquals("2.0", out.getVersion());
        assertEquals("Store title", out.getName());
        assertEquals("Store body", out.getDescription());
        assertEquals("mylib_collection_extra_collection", out.getCollectionId());
        assertTrue(out.isCollectionExists());
        assertEquals(meta, out.getExistingCollection());
    }

    @Test
    void hasMetadata_merge_trailingCollectionSuffix() {
        SubmitRootCollectionMetadata meta = SubmitRootCollectionMetadata.builder()
                .displayId("testcollection1_collection")
                .version("1")
                .name("N")
                .description("D")
                .build();
        SanitizedSubmitPayload out = service.applyLegacyMetadataRules(base("2"), Optional.of(meta));
        assertEquals("testcollection1", out.getId());
        assertEquals("1", out.getVersion());
    }

    @Test
    void hasMetadata_overwrite_unchangedFields_setsFlags() {
        SubmitRootCollectionMetadata meta = SubmitRootCollectionMetadata.builder()
                .displayId("lib_collection")
                .version("1")
                .name("X")
                .description("Y")
                .build();
        SanitizedSubmitPayload in = base("1");
        SanitizedSubmitPayload out = service.applyLegacyMetadataRules(in, Optional.of(meta));
        assertEquals(in.getId(), out.getId());
        assertEquals(in.getVersion(), out.getVersion());
        assertTrue(out.isCollectionExists());
        assertEquals(meta, out.getExistingCollection());
    }

    @Test
    void hasMetadata_new_errors() {
        SubmitRootCollectionMetadata meta = SubmitRootCollectionMetadata.builder()
                .displayId("lib_collection")
                .version("1")
                .build();
        SubmitConflictException ex = assertThrows(
                SubmitConflictException.class,
                () -> service.applyLegacyMetadataRules(base("0"), Optional.of(meta)));
        assertEquals("Submission id and version already in use", ex.getMessage());
    }
}
