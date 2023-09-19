package com.synbiohub.sbh3.dto.authplugindto;

import com.synbiohub.sbh3.entities.Plugins;
import lombok.Data;

@Data
public class PluginServerDTO {
    private Long id;
    private String name;

    public PluginServerDTO(Plugins plugins) {
        this.id = plugins.getId();
        this.name = plugins.getName();
    }
}
