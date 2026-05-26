package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dto.submit.ParsedSubmitPayload;
import com.synbiohub.sbh3.security.model.Role;
import com.synbiohub.sbh3.security.model.User;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.mock.web.MockMultipartHttpServletRequest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SubmitParseServiceTest {

    private final SubmitParseService service = new SubmitParseService();

    private static User user() {
        return User.builder()
                .username("alice")
                .name("Alice Q")
                .email("alice@example.org")
                .graphUri("https://synbiohub.example/user/alice")
                .role(Role.USER)
                .password("x")
                .build();
    }

    @Test
    void multipart_bindsFields_pluginFromPlugins_filePathSet() throws Exception {
        MockMultipartHttpServletRequest req = new MockMultipartHttpServletRequest();
        req.addParameter("id", "lib1");
        req.addParameter("name", "My lib");
        req.addParameter("description", "Desc");
        req.addParameter("version", "1");
        req.addParameter("citations", "1,2");
        req.addParameter("overwriteMerge", "0");
        req.addParameter("plugins", "default");
        req.addFile(new MockMultipartFile("file", "design.xml", "application/xml", "<xml/>".getBytes()));

        ParsedSubmitPayload p = service.parseMultipart(req, user());

        assertEquals("lib1", p.getId());
        assertEquals("My lib", p.getName());
        assertEquals("Desc", p.getDescription());
        assertEquals("1", p.getVersion());
        assertEquals("1,2", p.getCitations());
        assertEquals("0", p.getOverwriteMerge());
        assertEquals("default", p.getPlugin());
        assertNull(p.getCollectionUri());
        assertNotNull(p.getUploadedFilePath());
        assertTrue(p.getUploadedFilePath().endsWith(".xml"));
        assertEquals("alice", p.getCreatedBy().getUsername());
        assertEquals("Alice Q", p.getCreatedBy().getFullName());
        assertEquals("alice@example.org", p.getCreatedBy().getEmail());
        assertEquals("https://synbiohub.example/user/alice", p.getCreatedBy().getGraphUri());
    }

    @Test
    void multipart_pluginParamWinsOverPlugins() throws Exception {
        MockMultipartHttpServletRequest req = new MockMultipartHttpServletRequest();
        req.addParameter("id", "a");
        req.addParameter("name", "n");
        req.addParameter("description", "d");
        req.addParameter("version", "1");
        req.addParameter("citations", "");
        req.addParameter("overwriteMerge", "2");
        req.addParameter("plugin", "custom");
        req.addParameter("plugins", "ignored");

        ParsedSubmitPayload p = service.parseMultipart(req, user());
        assertEquals("custom", p.getPlugin());
    }

    @Test
    void multipart_invalidOverwriteMerge() {
        MockMultipartHttpServletRequest req = new MockMultipartHttpServletRequest();
        req.addParameter("id", "a");
        req.addParameter("name", "n");
        req.addParameter("description", "d");
        req.addParameter("version", "1");
        req.addParameter("citations", "");
        req.addParameter("overwriteMerge", "9");

        assertThrows(IllegalArgumentException.class, () -> service.parseMultipart(req, user()));
    }

    @Test
    void multipart_collectionUri() throws Exception {
        MockMultipartHttpServletRequest req = new MockMultipartHttpServletRequest();
        req.addParameter("id", "a");
        req.addParameter("name", "n");
        req.addParameter("description", "d");
        req.addParameter("version", "1");
        req.addParameter("citations", "");
        req.addParameter("overwriteMerge", "3");
        req.addParameter("plugin", "default");
        req.addParameter("collectionUri", "https://x/user/u/c/c_collection/1");

        ParsedSubmitPayload p = service.parseMultipart(req, user());
        assertEquals("https://x/user/u/c/c_collection/1", p.getCollectionUri());
    }
}
