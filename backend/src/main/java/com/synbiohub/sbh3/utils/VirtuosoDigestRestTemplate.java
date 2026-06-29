package com.synbiohub.sbh3.utils;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.auth.AuthScope;
import org.apache.hc.client5.http.auth.UsernamePasswordCredentials;
import org.apache.hc.client5.http.impl.auth.BasicCredentialsProvider;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;

/**
 * {@link RestTemplate} backed by Apache HttpClient with Digest auth (legacy Virtuoso {@code -auth} endpoints).
 * Does not send preemptive Basic auth; credentials are applied after a 401 Digest challenge.
 */
@Slf4j
@Component
public class VirtuosoDigestRestTemplate {

    private RestTemplate restTemplate;
    private CloseableHttpClient httpClient;

    public RestTemplate get() throws IOException {
        if (restTemplate == null) {
            synchronized (this) {
                if (restTemplate == null) {
                    init();
                }
            }
        }
        return restTemplate;
    }

    private void init() throws IOException {
        String username = ConfigUtil.get("username").asText();
        String password = ConfigUtil.get("password").asText();

        BasicCredentialsProvider credsProvider = new BasicCredentialsProvider();
        credsProvider.setCredentials(
                new AuthScope(null, -1),
                new UsernamePasswordCredentials(username, password.toCharArray()));

        httpClient = HttpClients.custom()
                .setDefaultCredentialsProvider(credsProvider)
                .build();

        HttpComponentsClientHttpRequestFactory factory = new HttpComponentsClientHttpRequestFactory(httpClient);
        restTemplate = new RestTemplate(factory);
        log.debug("Virtuoso Digest RestTemplate initialized for user {}", username);
    }

    @PreDestroy
    void shutdown() throws IOException {
        if (httpClient != null) {
            httpClient.close();
        }
    }
}
