package com.synbiohub.sbh3.utils;

import com.fasterxml.jackson.databind.JsonNode;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

/**
 * Legacy SynBioHub share-link hashes: {@code SHA1_HEX("synbiohub_" + SHA1_HEX(uri_utf8) + shareLinkSalt)}.
 * Single implementation shared by /shared listings, /shareLink, share-link verification and registry fetches.
 */
public final class ShareLinkUtil {

    private ShareLinkUtil() {
    }

    /** Configured {@code shareLinkSalt}, or "" when unset. */
    public static String salt() throws IOException {
        JsonNode node = ConfigUtil.get("shareLinkSalt");
        return node == null || node.isNull() ? "" : node.asText("");
    }

    public static String token(String uri, String salt) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            String innerHex = hex(md.digest(uri.getBytes(StandardCharsets.UTF_8)));
            md.reset();
            String payload = "synbiohub_" + innerHex + (salt == null ? "" : salt);
            return hex(md.digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 not available", e);
        }
    }

    /** Full share URI: {@code <uri>/<token>/share}. */
    public static String shareUri(String uri, String salt) {
        return uri + "/" + token(uri, salt) + "/share";
    }

    /** Browser path {@code /<uri minus databasePrefix>/<token>/share} (legacy shared.js). */
    public static String sharePath(String databasePrefix, String versionedUri, String salt) {
        String rel = versionedUri;
        if (databasePrefix != null && !databasePrefix.isEmpty() && rel.startsWith(databasePrefix)) {
            rel = rel.substring(databasePrefix.length());
        }
        while (rel.startsWith("/")) {
            rel = rel.substring(1);
        }
        return "/" + rel + "/" + token(versionedUri, salt) + "/share";
    }

    /**
     * Constant-time check accepting the object's, its collection's, or the object {@code /edit} hash,
     * mirroring SBH1 {@code getUrisFromReq}.
     */
    public static boolean matches(String objectUri, String collectionUri, String hash, String salt) {
        if (hash == null || hash.isBlank() || objectUri == null) {
            return false;
        }
        byte[] given = hash.getBytes(StandardCharsets.UTF_8);
        boolean ok = MessageDigest.isEqual(given, token(objectUri, salt).getBytes(StandardCharsets.UTF_8));
        if (collectionUri != null && !collectionUri.isBlank()) {
            ok |= MessageDigest.isEqual(given, token(collectionUri, salt).getBytes(StandardCharsets.UTF_8));
        }
        ok |= MessageDigest.isEqual(given, token(objectUri + "/edit", salt).getBytes(StandardCharsets.UTF_8));
        return ok;
    }

    /** True when {@code hash} is the {@code /edit} variant for {@code objectUri} (grants edit access in SBH1). */
    public static boolean isEditHash(String objectUri, String hash, String salt) {
        if (hash == null || objectUri == null) {
            return false;
        }
        return MessageDigest.isEqual(hash.getBytes(StandardCharsets.UTF_8),
                token(objectUri + "/edit", salt).getBytes(StandardCharsets.UTF_8));
    }

    private static String hex(byte[] digest) {
        StringBuilder sb = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            sb.append(String.format(Locale.US, "%02x", b & 0xff));
        }
        return sb.toString();
    }
}
