package com.synbiohub.sbh3.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synbiohub.sbh3.repo.SparqlRepository;
import com.synbiohub.sbh3.submit.SubmitPayload;
import com.synbiohub.sbh3.submit.SubmitRootCollectionMetadata;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.sbolstandard.core2.Collection;
import org.sbolstandard.core2.SBOLDocument;
import org.sbolstandard.core2.SBOLValidationException;
import org.sbolstandard.core2.TopLevel;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.net.URI;
import java.util.regex.Pattern;

@Service
@Slf4j
@RequiredArgsConstructor
public class CollectionService {

    static final Pattern COLLECTION_ID_PATTERN = Pattern.compile("^[a-zA-Z0-9_]+$");
    private final ObjectMapper mapper;
    private final UserService userService;
    private final SearchService searchService;
    private final SparqlRepository sparqlRepository;

// -------------------------------------------------------------------------
// sanitize — resolve collection URI, check existence, enforce overwrite_merge
// -------------------------------------------------------------------------

    /**
     * Two submission modes:
     * <ul>
     *   <li><b>New collection</b> — form {@code id} (+ optional {@code version}); {@code collectionUri} is computed.</li>
     *   <li><b>Existing collection</b> — form {@code rootCollections} is the target identity URI; defaults to merge mode 2.</li>
     * </ul>
     * {@code overwrite_merge} modes (legacy submit form):
     * 0 = new version, 1 = overwrite in place, 2 = merge, 3 = merge and replace remote duplicates.
     */
    public void sanitize(SubmitPayload payload) throws IOException {
        boolean submittingToExisting = payload.getCollectionUri() != null && payload.getId() == null;
        boolean creatingNew = payload.getId() != null;

        if (!submittingToExisting && !creatingNew) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Provide either rootCollections (existing collection) or id (new collection).");
        }

        if (submittingToExisting) {
            if (payload.getOverwriteMerge() == null) {
                payload.setOverwriteMerge("2");
            }
            if (payload.getUploadedFilePath() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "file is required when submitting into an existing collection.");
            }
        } else {
            resolveNewCollectionUri(payload);
        }

        String graphUri = graphUriForCollection(payload.getCollectionUri(), payload);
        boolean metadataExists = collectionExists(payload.getCollectionUri(), graphUri);
        payload.setExistingCollection(metadataExists
                ? loadExistingCollection(payload.getCollectionUri(), graphUri)
                : null);

        applyCollectionExistenceRules(payload, metadataExists, creatingNew);
    }

    /**
     * Resolves {@link SubmitPayload#getCollectionUri()} for a new collection from {@code id} and {@code version}.
     */
    private void resolveNewCollectionUri(SubmitPayload payload) {
        if (!COLLECTION_ID_PATTERN.matcher(payload.getId()).matches()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "id must contain only alphanumeric characters and underscores.");
        }
        if (payload.getVersion() == null) {
            payload.setVersion("1");
        }
        payload.setCollectionUri(uriPrefix(payload) + payload.collectionDisplayId() + "/" + payload.getVersion());
    }

    /**
     * Public collections live in {@code defaultGraph}; private user collections use the
     * submitter's named graph URI.
     */
    public String graphUriForCollection(String collectionUri, SubmitPayload payload) throws IOException {
        String publicGraph = ConfigUtil.get("defaultGraph").asText();
        if (collectionUri.startsWith(publicGraph) || collectionUri.contains("/public/")) {
            return publicGraph;
        }
        return userService.getUserByUsername(payload.getCreatedBy()).getGraphUri();
    }

    public boolean collectionExists(String collectionUri, String graphUri) throws IOException {
        String query = "ASK { <" + collectionUri + "> a <http://sbols.org/v2#Collection> . }";
        String raw = sparqlRepository.getQuery(query, graphUri);
        return mapper.readTree(raw).path("boolean").asBoolean(false);
    }

    public SubmitRootCollectionMetadata loadExistingCollection(String collectionUri, String graphUri)
            throws IOException {
        String sparql = searchService.getTopLevelMetadataSPARQL(collectionUri);
        String raw = sparqlRepository.getQuery(sparql, graphUri);
        JsonNode bindings = mapper.readTree(raw).path("results").path("bindings");
        if (!bindings.isArray() || bindings.isEmpty()) {
            return SubmitRootCollectionMetadata.builder().build();
        }
        JsonNode row = bindings.get(0);
        return SubmitRootCollectionMetadata.builder()
                .name(textValue(row, "name"))
                .description(textValue(row, "description"))
                .displayId(textValue(row, "displayId"))
                .version(textValue(row, "version"))
                .build();
    }

    private static String textValue(JsonNode binding, String key) {
        JsonNode node = binding.path(key);
        return node.isMissingNode() || node.isNull() ? null : node.path("value").asText(null);
    }

    /**
     * Legacy submit rules after collection metadata presence is known.
     * <p>
     * If metadata is missing, merge modes 2/3 are rejected. If metadata exists and mode is 0,
     * the submission is rejected (id+version already taken). Modes 2/3 copy name/description
     * from the store into the payload.
     */
    public void applyCollectionExistenceRules(SubmitPayload payload, boolean metadataExists,
                                               boolean creatingNew) {
        if (!metadataExists) {
            if (payload.getOverwriteMerge() != null) {
                int mode = parseOverwriteMerge(payload.getOverwriteMerge());
                if (mode == 2 || mode == 3) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Submission id and version do not exist");
                }
            }
            payload.setOverwriteMerge("0");
            if (creatingNew) {
                requireNonBlank(payload.getName(), "name");
                requireNonBlank(payload.getDescription(), "description");
            }
            return;
        }

        int mode = parseOverwriteMerge(
                payload.getOverwriteMerge() != null ? payload.getOverwriteMerge() : "0");

        if (mode == 2 || mode == 3) {
            fillPayloadFromExistingCollection(payload);
            return;
        }
        if (mode == 1) {
            return;
        }
        throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Submission id and version already in use");
    }

    private int parseOverwriteMerge(String raw) {
        try {
            return Integer.parseInt(raw.trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid overwrite_merge: " + raw);
        }
    }

    private void requireNonBlank(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, field + " is required.");
        }
    }

    /** Copies stored collection metadata into the payload when merging (modes 2/3). */
    public void fillPayloadFromExistingCollection(SubmitPayload payload) {
        SubmitRootCollectionMetadata existing = payload.getExistingCollection();
        if (existing == null) {
            return;
        }
        if (existing.getName() != null) {
            payload.setName(existing.getName());
        }
        if (existing.getDescription() != null) {
            payload.setDescription(existing.getDescription());
        }
        if (existing.getVersion() != null) {
            payload.setVersion(existing.getVersion());
        }
        if (existing.getDisplayId() != null) {
            String displayId = existing.getDisplayId();
            if (displayId.endsWith("_collection")) {
                payload.setId(displayId.substring(0, displayId.length() - "_collection".length()));
            }
        }
    }

    /**
     * URI prefix for new objects in this submission
     * (e.g. {@code https://synbiohub.org/user/alice/myproject/}).
     */
    public String uriPrefix(SubmitPayload payload) {
        String graphUri = userService.getUserByUsername(payload.getCreatedBy()).getGraphUri();
        if (payload.getCreatedBy() == null || graphUri == null || payload.getId() == null) {
            if (payload.getCollectionUri() == null) {
                return null;
            }
            return uriPrefixFromCollectionUri(payload, payload.getCollectionUri());
        }
        String base = graphUri.endsWith("/") ? graphUri : graphUri + "/";
        return base + payload.getId() + "/";
    }

    /**
     * Derives the object URI prefix from a root collection identity URI by removing
     * {@code {displayId}/{version}}.
     */
    public String uriPrefixFromCollectionUri(SubmitPayload payload, String collectionUri) {
        int lastSlash = collectionUri.lastIndexOf('/');
        if (lastSlash <= 0) {
            return null;
        }
        int prevSlash = collectionUri.lastIndexOf('/', lastSlash - 1);
        if (prevSlash <= 0) {
            return null;
        }
        return collectionUri.substring(0, prevSlash + 1);
    }

    public Collection getRootCollection(SBOLDocument doc, String displayId, String version) throws SBOLValidationException {
        org.sbolstandard.core2.Collection root = doc.getCollection(displayId, version);
        if (root == null) {
            root = doc.createCollection(displayId, version);
            log.debug("New root collection: {}", root.getIdentity());
        }
        return root;
    }

    /**
     * Adds all top-levels as collection members. Re-adds registry objects stripped earlier.
     */
    public void populateCollectionMembership(SubmitPayload payload) {
        String displayId = payload.collectionDisplayId();
        if (displayId == null) {
            return;
        }
        String version = payload.getVersion() != null ? payload.getVersion() : "1";
        SBOLDocument doc = payload.getSbolDocument();
        org.sbolstandard.core2.Collection rootCollection = doc.getCollection(displayId, version);
        if (rootCollection == null) {
            return;
        }

        URI rootIdentity = rootCollection.getIdentity();
        try {
            for (TopLevel topLevel : doc.getTopLevels()) {
                if (rootIdentity.equals(topLevel.getIdentity())) {
                    continue;
                }
                rootCollection.addMember(topLevel.getIdentity());
            }
            for (String uri : payload.getUrisFoundInSynBioHub()) {
                rootCollection.addMember(URI.create(uri));
            }
        } catch (SBOLValidationException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Failed to populate collection membership: " + e.getMessage());
        }
    }
}
