package com.synbiohub.sbh3.services;

import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * SpEL bean for {@code @PreAuthorize}: true when ShareLinkFilter verified this request's share hash.
 */
@Component("shareAccess")
public class ShareAccess {

    public boolean isShareRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            return attrs.getRequest().getAttribute(SparqlAccessService.SHARE_GRAPH_ATTR) != null;
        }
        return false;
    }
}
