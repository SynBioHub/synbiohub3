package com.synbiohub.sbh3.dto.configuration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ConfigurationResponse {
    private Long id;
    private String color;
    private String virtuosoDB;
}
