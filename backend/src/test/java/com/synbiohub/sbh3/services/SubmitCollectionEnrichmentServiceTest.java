package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dto.submit.ParsedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitCreatedBy;
import com.synbiohub.sbh3.dto.submit.SubmitRootCollectionMetadata;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmitCollectionEnrichmentServiceTest {

    private static final String PREFIX = "https://synbiohub.example/";
    private static final String COLLECTION_URI =
            PREFIX + "user/alice/my_lib/my_lib_collection/1.0";

    @Mock
    private SubmitCollectionLookupService submitCollectionLookupService;

    @InjectMocks
    private SubmitCollectionEnrichmentService service;

    @BeforeAll
    static void initConfig() {
        new com.synbiohub.sbh3.utils.ConfigUtil();
    }

    private static SubmitCreatedBy alice() {
        return SubmitCreatedBy.builder()
                .username("alice")
                .fullName("Alice")
                .email("alice@example.org")
                .graphUri(PREFIX + "user/alice")
                .build();
    }

    private static ParsedSubmitPayload uriOnlyPayload() {
        return ParsedSubmitPayload.builder()
                .id("")
                .name("")
                .description("")
                .version("")
                .citations("")
                .overwriteMerge("2")
                .plugin("default")
                .collectionUri(COLLECTION_URI)
                .uploadedFilePath("/tmp/x")
                .createdBy(alice())
                .build();
    }

    @Test
    void enrichFromCollectionUri_skipsWhenAllFieldsPresent() throws Exception {
        ParsedSubmitPayload complete = ParsedSubmitPayload.builder()
                .id("my_lib")
                .name("Title")
                .description("Desc")
                .version("1.0")
                .citations("")
                .overwriteMerge("2")
                .plugin("default")
                .collectionUri(COLLECTION_URI)
                .uploadedFilePath("/tmp/x")
                .createdBy(alice())
                .build();

        ParsedSubmitPayload out = service.enrichFromCollectionUri(complete);
        assertSame(complete, out);
        verify(submitCollectionLookupService, never()).getRootCollectionMetadataForUri(any(), any());
    }

    @Test
    void enrichFromCollectionUri_fillsMissingFieldsFromSparql() throws Exception {
        when(submitCollectionLookupService.getRootCollectionMetadataForUri(eq(COLLECTION_URI), any()))
                .thenReturn(Optional.of(SubmitRootCollectionMetadata.builder()
                        .name("My Library")
                        .description("A description")
                        .displayId("my_lib_collection")
                        .version("1.0")
                        .build()));

        ParsedSubmitPayload out = service.enrichFromCollectionUri(uriOnlyPayload());

        assertEquals("my_lib", out.getId());
        assertEquals("My Library", out.getName());
        assertEquals("A description", out.getDescription());
        assertEquals("1.0", out.getVersion());
        assertEquals(COLLECTION_URI, out.getCollectionUri());
    }

    @Test
    void enrichFromCollectionUri_unknownUri_throws() throws Exception {
        when(submitCollectionLookupService.getRootCollectionMetadataForUri(eq(COLLECTION_URI), any()))
                .thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.enrichFromCollectionUri(uriOnlyPayload()));
    }
}
