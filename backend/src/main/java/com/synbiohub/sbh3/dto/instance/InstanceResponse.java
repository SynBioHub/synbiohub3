package com.synbiohub.sbh3.dto.instance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InstanceResponse {
    private Long id;
    private String instanceName;
    private String virtuosoDB;
}
