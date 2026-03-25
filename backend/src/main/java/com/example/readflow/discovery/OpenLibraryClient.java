package com.example.readflow.discovery;

import com.example.readflow.discovery.dto.RecommendedBookDto;
import com.example.readflow.discovery.dto.SearchResultDto;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@Slf4j
public class OpenLibraryClient {

    private static final String SEARCH_URL = "https://openlibrary.org/search.json";
    private static final String FIELDS = "key,title,author_name,cover_i,isbn,subject,first_publish_year,number_of_pages_median";
    private static final String COVER_URL_TEMPLATE = "https://covers.openlibrary.org/b/id/%d-M.jpg";

    private final RestClient restClient;

    public OpenLibraryClient(
            RestClient.Builder restClientBuilder,
            @Value("${app.openlibrary.user-agent:ReadFlow (readflow@example.com)}") String userAgent) {
        this.restClient = restClientBuilder
                .defaultHeader("User-Agent", userAgent)
                .build();
    }

    @Cacheable(value = "openLibraryBooks", key = "'author:' + #author + ':' + #maxResults")
    public List<RecommendedBookDto> getBooksByAuthor(String author, int maxResults) {
        String url = SEARCH_URL + "?author=" + encodeParam(author)
                + "&fields=" + FIELDS + "&limit=" + maxResults;
        return fetchBooks(url);
    }

    @Cacheable(value = "openLibraryBooks", key = "'category:' + #category + ':' + #maxResults")
    public List<RecommendedBookDto> getBooksByCategory(String category, int maxResults) {
        String url = SEARCH_URL + "?subject=" + encodeParam(category)
                + "&fields=" + FIELDS + "&limit=" + maxResults;
        return fetchBooks(url);
    }

    @Cacheable(value = "openLibraryBooks", key = "'query:' + #query + ':' + #maxResults")
    public List<RecommendedBookDto> getBooksByQuery(String query, int maxResults) {
        String url = SEARCH_URL + "?q=" + encodeParam(query)
                + "&fields=" + FIELDS + "&limit=" + maxResults;
        return fetchBooks(url);
    }

    @Cacheable(value = "openLibrarySearch", key = "#query + ':' + #offset + ':' + #limit")
    public SearchResultDto searchBooks(String query, int offset, int limit) {
        String url = SEARCH_URL + "?q=" + encodeParam(query)
                + "&fields=" + FIELDS + "&offset=" + offset + "&limit=" + limit;
        return fetchBooksWithTotal(url);
    }

    private List<RecommendedBookDto> fetchBooks(String url) {
        try {
            OpenLibraryResponse response = doGet(url);
            if (response == null || response.docs() == null) {
                return Collections.emptyList();
            }

            return response.docs().stream()
                    .filter(doc -> doc.coverI() != null)
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (RestClientException e) {
            log.error("Failed to fetch books from Open Library: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private SearchResultDto fetchBooksWithTotal(String url) {
        try {
            OpenLibraryResponse response = doGet(url);
            if (response == null) {
                return new SearchResultDto(Collections.emptyList(), 0);
            }

            int numFound = response.numFound() != null ? response.numFound() : 0;

            if (response.docs() == null) {
                return new SearchResultDto(Collections.emptyList(), numFound);
            }

            List<RecommendedBookDto> books = response.docs().stream()
                    .filter(doc -> doc.coverI() != null)
                    .map(this::mapToDto)
                    .collect(Collectors.toList());

            return new SearchResultDto(books, numFound);
        } catch (RestClientException e) {
            log.error("Failed to search books from Open Library: {}", e.getMessage());
            return new SearchResultDto(Collections.emptyList(), 0);
        }
    }

    private OpenLibraryResponse doGet(String url) {
        return restClient.get()
                .uri(url)
                .retrieve()
                .body(OpenLibraryResponse.class);
    }

    private RecommendedBookDto mapToDto(OpenLibraryDoc doc) {
        List<String> subjects = doc.subject();
        if (subjects != null && subjects.size() > 3) {
            subjects = subjects.subList(0, 3);
        }

        // Prefer ISBN-13 over ISBN-10
        String isbn = null;
        if (doc.isbn() != null && !doc.isbn().isEmpty()) {
            isbn = doc.isbn().stream()
                    .filter(i -> i.length() == 13)
                    .findFirst()
                    .orElse(doc.isbn().stream()
                            .filter(i -> i.length() == 10)
                            .findFirst()
                            .orElse(doc.isbn().get(0)));
        }

        String coverUrl = doc.coverI() != null
                ? String.format(COVER_URL_TEMPLATE, doc.coverI())
                : null;

        return new RecommendedBookDto(doc.title(), doc.authorName(), subjects,
                doc.firstPublishYear(), doc.numberOfPagesMedian(), isbn, coverUrl);
    }

    private String encodeParam(String param) {
        return URLEncoder.encode(param, StandardCharsets.UTF_8);
    }

    // Jackson records for Open Library API response mapping
    private record OpenLibraryResponse(Integer numFound, List<OpenLibraryDoc> docs) {}

    private record OpenLibraryDoc(
            String title,
            @JsonProperty("author_name") List<String> authorName,
            List<String> subject,
            @JsonProperty("first_publish_year") Integer firstPublishYear,
            @JsonProperty("number_of_pages_median") Integer numberOfPagesMedian,
            List<String> isbn,
            @JsonProperty("cover_i") Long coverI
    ) {}
}
