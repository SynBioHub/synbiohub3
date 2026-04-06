package com.synbiohub.sbh3.security.customsecurity;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Resolves the request path within the application (excluding context path),
 * for consistent matching against {@code application.yml} endpoint patterns.
 */
public final class ServletPathUtil {

    private ServletPathUtil() {
    }

    public static String getPathWithinApplication(HttpServletRequest request) {
        String path = request.getServletPath();
        if (path == null || path.isEmpty()) {
            path = request.getRequestURI();
            String ctx = request.getContextPath();
            if (ctx != null && !ctx.isEmpty() && path.startsWith(ctx)) {
                path = path.substring(ctx.length());
            }
        }
        return path;
    }
}
