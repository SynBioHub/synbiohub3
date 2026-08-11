package com.synbiohub.sbh3.submit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Metadata for a root collection that already exists in the triple store.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitRootCollectionMetadata {
    private String name;
    private String description;
    private String displayId;
    private String version;
}
