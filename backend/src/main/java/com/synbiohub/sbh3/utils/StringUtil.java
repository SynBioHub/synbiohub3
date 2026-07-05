package com.synbiohub.sbh3.utils;

public interface StringUtil {

    static String fixDisplayId(String displayId) {
        if (displayId == null || displayId.isEmpty()) {
            return "_";
        }
        displayId = displayId.replaceAll("[^a-zA-Z0-9_]", "_");
        displayId = displayId.replace(" ", "_");
        if (Character.isDigit(displayId.charAt(0))) {
            displayId = "_" + displayId;
        }
        return displayId;
    }

     static String displayIdFromFilename(String filename) {
        String displayId = filename;
        int dot = displayId.lastIndexOf('.');
        if (dot != -1) {
            displayId = displayId.substring(0, dot);
        }
        int slash = displayId.lastIndexOf('/');
        if (slash != -1) {
            displayId = displayId.substring(slash + 1);
        }
        return displayId;
    }

    /** Escapes a value for substitution into SPARQL string literal positions in templates. */
     static String sparqlStringLiteral(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
