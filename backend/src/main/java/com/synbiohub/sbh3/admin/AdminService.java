package com.synbiohub.sbh3.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.synbiohub.sbh3.utils.ConfigUtil;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@NoArgsConstructor
public class AdminService {

    public JsonNode getStatus() {
        return ConfigUtil.get("");
    }
}
