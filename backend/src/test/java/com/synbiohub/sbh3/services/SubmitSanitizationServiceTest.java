package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dto.submit.ParsedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitCreatedBy;
import com.synbiohub.sbh3.dto.submit.SubmitUnauthorizedException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SubmitSanitizationServiceTest {

    private static final String PREFIX = "https://synbiohub.example/";

    private final SubmitSanitizationService service = new SubmitSanitizationService();

    private static SubmitCreatedBy alice() {
        return SubmitCreatedBy.builder()
                .username("alice")
                .fullName("Alice Q")
                .email("alice@example.org")
                .graphUri("https://synbiohub.example/user/alice")
                .build();
    }

    /** New-collection defaults: valid id, version, name, description. */
    private static ParsedSubmitPayload newCollectionPayload(String om, String id, String version, String name, String desc,
                                                            SubmitCreatedBy createdBy) {
        return newCollectionPayload(om, id, version, name, desc, createdBy, "");
    }

    private static ParsedSubmitPayload newCollectionPayload(String om, String id, String version, String name, String desc,
                                                            SubmitCreatedBy createdBy, String citations) {
        return ParsedSubmitPayload.builder()
                .id(id)
                .name(name)
                .description(desc)
                .version(version)
                .citations(citations != null ? citations : "")
                .overwriteMerge(om)
                .plugin("default")
                .collectionUri(null)
                .uploadedFilePath(null)
                .createdBy(createdBy)
                .build();
    }

    @Test
    void merge_B1_emptyCollectionUri_rebuildsFromIdAndVersion() throws Exception {
        ParsedSubmitPayload p = ParsedSubmitPayload.builder()
                .id("my_lib")
                .name("N")
                .description("D")
                .version("2")
                .citations("")
                .overwriteMerge("3")
                .plugin("default")
                .collectionUri("")
                .uploadedFilePath(null)
                .createdBy(alice())
                .build();

        SanitizedSubmitPayload s = service.sanitizeSubmission(p, PREFIX);
        assertEquals("my_lib", s.getId());
        assertEquals("my_lib_collection", s.getCollectionId());
        assertEquals("2", s.getVersion());
        assertEquals("https://synbiohub.example/user/alice/my_lib/my_lib_collection/2", s.getCollectionUri());
        assertEquals(List.of(), s.getCitationArray());
        assertFalse(s.isCollectionExists());
        assertNull(s.getExistingCollection());
    }

    @Test
    void merge_B1_emptyCollectionUriMissingId_errors() {
        ParsedSubmitPayload p = ParsedSubmitPayload.builder()
                .id("")
                .name("")
                .description("")
                .version("1")
                .citations("")
                .overwriteMerge("2")
                .plugin("default")
                .collectionUri(null)
                .uploadedFilePath(null)
                .createdBy(alice())
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.sanitizeSubmission(p, PREFIX));
        assertEquals("Please select a collection to add to", ex.getMessage());
    }

    @Test
    void merge_B2_parsesStandardPrivateCollectionUri() throws Exception {
        SubmitCreatedBy by = SubmitCreatedBy.builder()
                .username("dfang97")
                .fullName("D")
                .email("d@e.f")
                .graphUri("https://synbiohub.org/user/dfang97")
                .build();
        String uri = "https://synbiohub.org/user/dfang97/test1/test1_collection/1";
        ParsedSubmitPayload p = ParsedSubmitPayload.builder()
                .id("ignored")
                .name("N")
                .description("D")
                .version("ignored")
                .citations("")
                .overwriteMerge("2")
                .plugin("default")
                .collectionUri(uri)
                .uploadedFilePath(null)
                .createdBy(by)
                .build();

        SanitizedSubmitPayload s = service.sanitizeSubmission(p, "https://synbiohub.org/");
        assertEquals("test1", s.getId());
        assertEquals("test1_collection", s.getCollectionId());
        assertEquals("1", s.getVersion());
        assertEquals(uri, s.getCollectionUri());
        assertEquals(List.of(), s.getCitationArray());
    }

    @Test
    void merge_B2_wrongUserPrefix_invalid() {
        ParsedSubmitPayload p = ParsedSubmitPayload.builder()
                .id("x")
                .version("1")
                .name("n")
                .description("d")
                .citations("")
                .overwriteMerge("2")
                .plugin("default")
                .collectionUri("https://synbiohub.example/user/other/test1/test1_collection/1")
                .uploadedFilePath(null)
                .createdBy(alice())
                .build();

        assertThrows(IllegalArgumentException.class, () -> service.sanitizeSubmission(p, PREFIX));
    }

    @Test
    void merge_B2_malformedPath_invalid() {
        ParsedSubmitPayload p = ParsedSubmitPayload.builder()
                .id("x")
                .version("1")
                .name("n")
                .description("d")
                .citations("")
                .overwriteMerge("2")
                .plugin("default")
                .collectionUri(PREFIX + "user/alice/test1/wrong_collection/1")
                .uploadedFilePath(null)
                .createdBy(alice())
                .build();

        assertThrows(IllegalArgumentException.class, () -> service.sanitizeSubmission(p, PREFIX));
    }

    @Test
    void newCollection_overwrite0_canonicalCollectionUriAndId() throws Exception {
        ParsedSubmitPayload p = newCollectionPayload("0", "my_lib", "1.0", "Title", "Desc", alice());

        SanitizedSubmitPayload s = service.sanitizeSubmission(p, PREFIX);

        assertEquals("my_lib", s.getId());
        assertEquals("my_lib_collection", s.getCollectionId());
        assertEquals(
                "https://synbiohub.example/user/alice/my_lib/my_lib_collection/1.0",
                s.getCollectionUri());
        assertEquals(List.of(), s.getCitationArray());
    }

    @Test
    void newCollection_citationsTrimmedAndParsed() throws Exception {
        ParsedSubmitPayload p = newCollectionPayload("0", "my_lib", "1.0", "Title", "Desc", alice(), "  10,20,30  ");
        SanitizedSubmitPayload s = service.sanitizeSubmission(p, PREFIX);
        assertEquals("10,20,30", s.getCitations());
        assertEquals(List.of(10, 20, 30), s.getCitationArray());
    }

    @Test
    void newCollection_citationsInvalid_spaceAfterCommaFailsRegex() {
        ParsedSubmitPayload p = newCollectionPayload("0", "my_lib", "1.0", "Title", "Desc", alice(), "1, 2");
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.sanitizeSubmission(p, PREFIX));
        assertEquals("Please enter valid PubMed citation numbers", ex.getMessage());
    }

    @Test
    void newCollection_citationsInvalid_nonNumeric() {
        ParsedSubmitPayload p = newCollectionPayload("0", "my_lib", "1.0", "Title", "Desc", alice(), "1,abc");
        assertThrows(IllegalArgumentException.class, () -> service.sanitizeSubmission(p, PREFIX));
    }

    @Test
    void newCollection_usernameEncodedInPath() throws Exception {
        SubmitCreatedBy by = SubmitCreatedBy.builder()
                .username("alice@lab.org")
                .fullName("A")
                .email("a@b.c")
                .graphUri("g")
                .build();
        ParsedSubmitPayload p = newCollectionPayload("1", "my_lib", "1.0", "Title", "Desc", by);

        SanitizedSubmitPayload s = service.sanitizeSubmission(p, PREFIX);
        assertEquals(
                "https://synbiohub.example/user/alice%40lab.org/my_lib/my_lib_collection/1.0",
                s.getCollectionUri());
    }

    @Test
    void newCollection_emptyId() {
        ParsedSubmitPayload p = newCollectionPayload("0", "", "1.0", "Title", "Desc", alice());
        assertThrows(IllegalArgumentException.class, () -> service.sanitizeSubmission(p, PREFIX));
    }

    @Test
    void newCollection_invalidIdLeadingDigit() {
        ParsedSubmitPayload p = newCollectionPayload("0", "9bad", "1.0", "Title", "Desc", alice());
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.sanitizeSubmission(p, PREFIX));
        assertEquals("Please enter a valid id", ex.getMessage());
    }

    @Test
    void newCollection_invalidVersion() {
        ParsedSubmitPayload p = newCollectionPayload("0", "my_lib", "a1", "Title", "Desc", alice());
        assertThrows(IllegalArgumentException.class, () -> service.sanitizeSubmission(p, PREFIX));
    }

    @Test
    void newCollection_emptyName() {
        ParsedSubmitPayload p = newCollectionPayload("0", "my_lib", "1.0", "  ", "Desc", alice());
        assertThrows(IllegalArgumentException.class, () -> service.sanitizeSubmission(p, PREFIX));
    }

    @Test
    void createdByMissing_401Message() {
        ParsedSubmitPayload p = newCollectionPayload("0", "my_lib", "1.0", "Title", "Desc", null);

        SubmitUnauthorizedException ex = assertThrows(
                SubmitUnauthorizedException.class,
                () -> service.sanitizeSubmission(p, PREFIX));
        assertEquals("Must be logged in to submit", ex.getMessage());
    }

    @Test
    void payloadNull_401() {
        assertThrows(SubmitUnauthorizedException.class, () -> service.sanitizeSubmission(null, PREFIX));
    }

    @Test
    void encodeURIComponent_spaces() {
        assertEquals("a%20b", SubmitSanitizationService.encodeURIComponent("a b"));
    }

    /** Legacy submit.js: dummy temp path when no file so downstream always has a path. */
    @Test
    void newCollection_nullUpload_getsPlaceholderTempPath() throws Exception {
        ParsedSubmitPayload p = newCollectionPayload("0", "my_lib", "1.0", "Title", "Desc", alice());
        SanitizedSubmitPayload s = service.sanitizeSubmission(p, PREFIX);
        assertNotNull(s.getUploadedFilePath());
        assertTrue(s.getUploadedFilePath().contains("sbh-submit-empty-"));
        assertTrue(s.getUploadedFilePath().endsWith(".tmp"));
    }

    @Test
    void newCollection_blankUpload_getsPlaceholderTempPath() throws Exception {
        ParsedSubmitPayload p = ParsedSubmitPayload.builder()
                .id("my_lib")
                .name("Title")
                .description("Desc")
                .version("1.0")
                .citations("")
                .overwriteMerge("0")
                .plugin("default")
                .collectionUri(null)
                .uploadedFilePath("   ")
                .createdBy(alice())
                .build();
        SanitizedSubmitPayload s = service.sanitizeSubmission(p, PREFIX);
        assertTrue(s.getUploadedFilePath().contains("sbh-submit-empty-"));
    }

    @Test
    void newCollection_existingUploadPath_preserved() throws Exception {
        String path = "/tmp/sbh-persisted-upload.sbol";
        ParsedSubmitPayload p = ParsedSubmitPayload.builder()
                .id("my_lib")
                .name("Title")
                .description("Desc")
                .version("1.0")
                .citations("")
                .overwriteMerge("0")
                .plugin("default")
                .collectionUri(null)
                .uploadedFilePath(path)
                .createdBy(alice())
                .build();
        SanitizedSubmitPayload s = service.sanitizeSubmission(p, PREFIX);
        assertEquals(path, s.getUploadedFilePath());
    }
}
