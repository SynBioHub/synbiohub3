package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitCreatedBy;
import com.synbiohub.sbh3.dto.submit.SubmitRootCollectionMetadata;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmitCollectionLookupServiceTest {

    @Mock
    private SearchService searchService;

    @InjectMocks
    private SubmitCollectionLookupService service;

    private static SanitizedSubmitPayload sampleSanitized() {
        return SanitizedSubmitPayload.builder()
                .id("my_lib")
                .name("Title")
                .description("Desc")
                .version("1.0")
                .citations("")
                .overwriteMerge("0")
                .plugin("default")
                .collectionUri("https://synbiohub.example/user/alice/my_lib/my_lib_collection/1.0")
                .collectionId("my_lib_collection")
                .citationArray(List.of())
                .uploadedFilePath("/tmp/x")
                .createdBy(SubmitCreatedBy.builder()
                        .username("alice")
                        .fullName("A")
                        .email("a@b.c")
                        .graphUri("")
                        .build())
                .collectionExists(false)
                .existingCollection(null)
                .build();
    }

    @Test
    void getRootCollectionMetadata_emptyBindings_returnsEmpty() throws Exception {
        when(searchService.resolveNamedGraphForSubmit(any(SubmitCreatedBy.class)))
                .thenReturn("https://synbiohub.example/user/alice");
        when(searchService.SPARQLQuery(anyString(), eq("https://synbiohub.example/user/alice")))
                .thenReturn("{\"results\":{\"bindings\":[]}}");

        assertFalse(service.getRootCollectionMetadata(sampleSanitized()).isPresent());
    }

    @Test
    void getRootCollectionMetadata_parsesFirstRow() throws Exception {
        when(searchService.resolveNamedGraphForSubmit(any(SubmitCreatedBy.class)))
                .thenReturn("https://synbiohub.example/user/alice");
        when(searchService.SPARQLQuery(anyString(), eq("https://synbiohub.example/user/alice")))
                .thenReturn(
                        "{\"results\":{\"bindings\":[{\"name\":{\"value\":\"My lib\"},"
                                + "\"displayId\":{\"value\":\"my_lib_collection\"},"
                                + "\"version\":{\"value\":\"1.0\"}}]}}");

        Optional<SubmitRootCollectionMetadata> meta = service.getRootCollectionMetadata(sampleSanitized());
        assertTrue(meta.isPresent());
        assertEquals("My lib", meta.get().getName());
        assertEquals("my_lib_collection", meta.get().getDisplayId());
        assertEquals("1.0", meta.get().getVersion());
    }

    @Test
    void getRootCollectionMetadata_usesExplicitGraphUriFromCreatedBy() throws Exception {
        SanitizedSubmitPayload s = sampleSanitized().toBuilder()
                .createdBy(SubmitCreatedBy.builder()
                        .username("alice")
                        .fullName("A")
                        .email("a@b.c")
                        .graphUri("https://custom/graph/alice")
                        .build())
                .build();
        when(searchService.resolveNamedGraphForSubmit(s.getCreatedBy()))
                .thenReturn("https://custom/graph/alice");
        when(searchService.SPARQLQuery(anyString(), eq("https://custom/graph/alice")))
                .thenReturn("{\"results\":{\"bindings\":[]}}");

        service.getRootCollectionMetadata(s);
        verify(searchService).SPARQLQuery(anyString(), eq("https://custom/graph/alice"));
    }

    @Test
    void getRootCollectionMetadata_blankNamedGraph_usesDefaultSparqlGraphParam() throws Exception {
        SanitizedSubmitPayload s = sampleSanitized().toBuilder()
                .createdBy(SubmitCreatedBy.builder()
                        .username("")
                        .fullName("")
                        .email("")
                        .graphUri("")
                        .build())
                .build();
        when(searchService.resolveNamedGraphForSubmit(s.getCreatedBy())).thenReturn("");
        when(searchService.SPARQLQuery(anyString(), isNull())).thenReturn("{\"results\":{\"bindings\":[]}}");

        assertFalse(service.getRootCollectionMetadata(s).isPresent());
        verify(searchService).SPARQLQuery(anyString(), isNull());
    }
}
