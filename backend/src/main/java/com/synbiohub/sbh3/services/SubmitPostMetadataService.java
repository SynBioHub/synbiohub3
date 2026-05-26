package com.synbiohub.sbh3.services;

import com.synbiohub.sbh3.dto.submit.SanitizedSubmitPayload;
import com.synbiohub.sbh3.dto.submit.SubmitConflictException;
import com.synbiohub.sbh3.dto.submit.SubmitRootCollectionMetadata;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * Legacy submit.js rules after collection metadata: merge / overwrite / coerce / conflict errors.
 */
@Service
public class SubmitPostMetadataService {

    /**
     * @param sanitized payload from {@link SubmitSanitizationService} (lookup flags not yet applied)
     * @param existing   result of {@link SubmitCollectionLookupService#getRootCollectionMetadata(SanitizedSubmitPayload)}
     */
    public SanitizedSubmitPayload applyLegacyMetadataRules(
            SanitizedSubmitPayload sanitized,
            Optional<SubmitRootCollectionMetadata> existing) {
        String om = sanitized.getOverwriteMerge() != null ? sanitized.getOverwriteMerge().trim() : "";
        boolean mergeOrAdd = "2".equals(om) || "3".equals(om);

        if (existing.isEmpty()) {
            if (mergeOrAdd) {
                throw new SubmitConflictException("Submission id and version do not exist");
            }
            return sanitized.toBuilder()
                    .overwriteMerge("0")
                    .collectionExists(false)
                    .existingCollection(null)
                    .build();
        }

        SubmitRootCollectionMetadata meta = existing.get();
        if (mergeOrAdd) {
            String displayId = meta.getDisplayId();
            String newId = stripFirstCollectionSuffix(displayId, sanitized.getId());
            String version = meta.getVersion() != null ? meta.getVersion() : sanitized.getVersion();
            String name = meta.getName() != null ? meta.getName() : "";
            String description = meta.getDescription() != null ? meta.getDescription() : "";
            String newCollectionId = (displayId != null && !displayId.isBlank())
                    ? displayId
                    : newId + "_collection";
            return sanitized.toBuilder()
                    .id(newId)
                    .version(version)
                    .name(name)
                    .description(description)
                    .collectionId(newCollectionId)
                    .collectionExists(true)
                    .existingCollection(meta)
                    .build();
        }
        if ("1".equals(om)) {
            return sanitized.toBuilder()
                    .collectionExists(true)
                    .existingCollection(meta)
                    .build();
        }
        throw new SubmitConflictException("Submission id and version already in use");
    }

    /**
     * {@code metaData.displayId.replace('_collection', '')} in legacy JS (first occurrence only).
     */
    private static String stripFirstCollectionSuffix(String displayId, String fallbackId) {
        if (displayId == null || displayId.isBlank()) {
            return fallbackId != null ? fallbackId : "";
        }
        String marker = "_collection";
        int i = displayId.indexOf(marker);
        if (i < 0) {
            return displayId;
        }
        return displayId.substring(0, i) + displayId.substring(i + marker.length());
    }
}
