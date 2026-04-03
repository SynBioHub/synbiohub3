package com.synbiohub.sbh3.security.customsecurity;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Identifies {@code GET /browse}, which must stay public (no session / JWT required).
 */
public final class PublicBrowsePath {

    private PublicBrowsePath() {
    }

    public static boolean isBrowse(HttpServletRequest request) {
        return "/browse".equals(ServletPathUtil.getPathWithinApplication(request));
    }
}
