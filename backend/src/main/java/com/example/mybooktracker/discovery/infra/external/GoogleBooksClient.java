package com.example.mybooktracker.discovery.infra.external;

import com.example.mybooktracker.discovery.domain.BookDiscoveryProvider;
import com.example.mybooktracker.discovery.domain.DiscoveryBook;
import com.example.mybooktracker.discovery.domain.DiscoverySearchResult;
import com.example.mybooktracker.discovery.infra.external.GoogleBooksResponseMapper.GoogleBooksResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
@ConditionalOnProperty(name = "app.discovery.provider", havingValue = "google-books", matchIfMissing = true)
// Adapter pattern: translates the Google Books API into the provider interface used by the discovery layer.
public class GoogleBooksClient implements BookDiscoveryProvider {

    private static final String VOLUMES_PATH = "/volumes";
    private static final int MAX_RESULTS_PER_REQUEST = 40;

    private final RestClient restClient;
    private final String apiKey;
    private final GoogleBooksResponseMapper responseMapper = new GoogleBooksResponseMapper();

    public GoogleBooksClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.google-books.base-url:https://www.googleapis.com/books/v1}") String baseUrl,
            @Value("${app.google-books.api-key:}") String apiKey) {
        this.restClient = restClientBuilder
                .baseUrl(baseUrl)
                .build();
        this.apiKey = apiKey;
    }

    @Cacheable(value = "discoveryBooks", key = "'author:' + #author + ':' + #maxResults")
    @Override
    public List<DiscoveryBook> getBooksByAuthor(String author, int maxResults) {
        return fetchBooks(buildFieldQuery("inauthor", author), 0, maxResults);
    }

    @Cacheable(value = "discoveryBooks", key = "'category:' + #category + ':' + #maxResults")
    @Override
    public List<DiscoveryBook> getBooksByCategory(String category, int maxResults) {
        return fetchBooks(buildFieldQuery("subject", category), 0, maxResults);
    }

    @Cacheable(value = "discoveryBooks", key = "'query:' + #query + ':' + #maxResults")
    @Override
    public List<DiscoveryBook> getBooksByQuery(String query, int maxResults) {
        return fetchBooks(query, 0, maxResults);
    }

    @Cacheable(value = "discoverySearch", key = "#query + ':' + #offset + ':' + #limit")
    @Override
    public DiscoverySearchResult searchBooks(String query, int offset, int limit) {
        try {
            GoogleBooksResponse response = search(query, offset, limit);
            if (response == null) {
                return new DiscoverySearchResult(Collections.emptyList(), 0);
            }

            List<DiscoveryBook> books = responseMapper.mapBooks(response.items());
            int totalItems = response.totalItems() != null ? response.totalItems() : 0;
            return new DiscoverySearchResult(books, totalItems);
        } catch (RestClientException e) {
            log.error("Failed to search books from Google Books: {}", e.getMessage());
            return new DiscoverySearchResult(Collections.emptyList(), 0);
        }
    }

    private List<DiscoveryBook> fetchBooks(String query, int offset, int limit) {
        try {
            GoogleBooksResponse response = search(query, offset, limit);
            if (response == null || response.items() == null) {
                return Collections.emptyList();
            }

            return responseMapper.mapBooks(response.items());
        } catch (RestClientException e) {
            log.error("Failed to fetch books from Google Books: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private GoogleBooksResponse search(String query, int offset, int limit) {
        return restClient.get()
                .uri(uriBuilder -> {
                    uriBuilder.path(VOLUMES_PATH)
                            .queryParam("q", query)
                            .queryParam("startIndex", Math.max(offset, 0))
                            .queryParam("maxResults", clampMaxResults(limit))
                            .queryParam("printType", "books");

                    if (StringUtils.hasText(apiKey)) {
                        uriBuilder.queryParam("key", apiKey);
                    }

                    return uriBuilder.build();
                })
                .retrieve()
                .body(GoogleBooksResponse.class);
    }

    private String buildFieldQuery(String field, String value) {
        return field + ":" + value;
    }

    private int clampMaxResults(int limit) {
        return Math.max(0, Math.min(limit, MAX_RESULTS_PER_REQUEST));
    }
}
