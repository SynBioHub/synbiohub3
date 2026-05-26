package com.synbiohub.sbh3.dto.submit;

import lombok.Builder;
import lombok.Value;

/**
 * SBOL Collection metadata for a single root URI, from SPARQL (see {@code RootCollectionMetadataForUri.sparql}).
 */
@Value
@Builder
public class SubmitRootCollectionMetadata {
    String name;
    String description;
    String displayId;
    String version;
}
