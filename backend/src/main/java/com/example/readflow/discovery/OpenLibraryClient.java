package com.example.readflow.discovery;

import com.example.readflow.discovery.dto.RecommendedBookDto;
import com.example.readflow.discovery.dto.SearchResultDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@Slf4j
public class OpenLibraryClient {

    private static final String SEARCH_URL = "https://openlibrary.org/search.json";
    private static final String FIELDS = "key,title,author_name,cover_i,isbn,subject,first_publish_year,number_of_pages_median";
    private static final String COVER_URL_TEMPLATE = "https://covers.openlibrary.org/b/id/%d-L.jpg";
    private static final String DEFAULT_LANGUAGE = "ger";

    private final RestTemplate restTemplate;
    private final HttpHeaders headers;

    public OpenLibraryClient(
            RestTemplate restTemplate,
            @Value("${app.openlibrary.user-agent:ReadFlow (readflow@example.com)}") String userAgent) {
        this.restTemplate = restTemplate;
        this.headers = new HttpHeaders();
        this.headers.set("User-Agent", userAgent);
    }

    @Cacheable(value = "openLibraryBooks", key = "'author:' + #author + ':' + #maxResults")
    public List<RecommendedBookDto> getBooksByAuthor(String author, int maxResults) {
        String url = SEARCH_URL + "?author=" + encodeParam(author)
                + "&language=" + DEFAULT_LANGUAGE
                + "&fields=" + FIELDS + "&limit=" + maxResults;
        return fetchBooks(url);
    }

    @Cacheable(value = "openLibraryBooks", key = "'category:' + #category + ':' + #maxResults")
    public List<RecommendedBookDto> getBooksByCategory(String category, int maxResults) {
        String url = SEARCH_URL + "?subject=" + encodeParam(category)
                + "&language=" + DEFAULT_LANGUAGE
                + "&fields=" + FIELDS + "&limit=" + maxResults;
        return fetchBooks(url);
    }

    @Cacheable(value = "openLibraryBooks", key = "'query:' + #query + ':' + #maxResults")
    public List<RecommendedBookDto> getBooksByQuery(String query, int maxResults) {
        String url = SEARCH_URL + "?q=" + encodeParam(query)
                + "&language=" + DEFAULT_LANGUAGE
                + "&fields=" + FIELDS + "&limit=" + maxResults;
        return fetchBooks(url);
    }

    @Cacheable(value = "openLibrarySearch", key = "#query + ':' + #offset + ':' + #limit")
    public SearchResultDto searchBooks(String query, int offset, int limit) {
        String url = SEARCH_URL + "?q=" + encodeParam(query)
                + "&language=" + DEFAULT_LANGUAGE
                + "&fields=" + FIELDS + "&offset=" + offset + "&limit=" + limit;
        return fetchBooksWithTotal(url);
    }

    @SuppressWarnings("unchecked")
    private List<RecommendedBookDto> fetchBooks(String url) {
        try {
            Map<String, Object> response = doGet(url);
            if (response == null || !response.containsKey("docs")) {
                return Collections.emptyList();
            }

            List<Map<String, Object>> docs = (List<Map<String, Object>>) response.get("docs");
            return docs.stream()
                    .filter(this::hasCover)
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        } catch (RestClientException e) {
            log.error("Failed to fetch books from Open Library: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @SuppressWarnings("unchecked")
    private SearchResultDto fetchBooksWithTotal(String url) {
        try {
            Map<String, Object> response = doGet(url);
            if (response == null || !response.containsKey("docs")) {
                int total = response != null && response.containsKey("numFound")
                        ? ((Number) response.get("numFound")).intValue() : 0;
                return new SearchResultDto(Collections.emptyList(), total);
            }

            int numFound = response.containsKey("numFound")
                    ? ((Number) response.get("numFound")).intValue() : 0;

            List<Map<String, Object>> docs = (List<Map<String, Object>>) response.get("docs");
            List<RecommendedBookDto> books = docs.stream()
                    .filter(this::hasCover)
                    .map(this::mapToDto)
                    .collect(Collectors.toList());

            return new SearchResultDto(books, numFound);
        } catch (RestClientException e) {
            log.error("Failed to search books from Open Library: {}", e.getMessage());
            return new SearchResultDto(Collections.emptyList(), 0);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> doGet(String url) {
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(url, HttpMethod.GET, entity, Map.class).getBody();
    }

    private boolean hasCover(Map<String, Object> doc) {
        return doc.containsKey("cover_i") && doc.get("cover_i") != null;
    }

    @SuppressWarnings("unchecked")
    private RecommendedBookDto mapToDto(Map<String, Object> doc) {
        String title = (String) doc.get("title");
        List<String> authors = (List<String>) doc.get("author_name");
        List<String> subjects = (List<String>) doc.get("subject");

        // Limit subjects to first 3 to keep it concise
        if (subjects != null && subjects.size() > 3) {
            subjects = subjects.subList(0, 3);
        }

        Integer firstPublishYear = doc.containsKey("first_publish_year")
                ? ((Number) doc.get("first_publish_year")).intValue() : null;
        String publishedDate = firstPublishYear != null ? String.valueOf(firstPublishYear) : null;

        Integer pageCount = doc.containsKey("number_of_pages_median")
                ? ((Number) doc.get("number_of_pages_median")).intValue() : null;

        // Prefer ISBN-13 over ISBN-10
        String isbn = null;
        List<String> isbns = (List<String>) doc.get("isbn");
        if (isbns != null && !isbns.isEmpty()) {
            isbn = isbns.stream()
                    .filter(i -> i.length() == 13)
                    .findFirst()
                    .orElse(isbns.stream()
                            .filter(i -> i.length() == 10)
                            .findFirst()
                            .orElse(isbns.get(0)));
        }

        // Cover URL from cover_i
        Number coverId = (Number) doc.get("cover_i");
        String coverUrl = coverId != null
                ? String.format(COVER_URL_TEMPLATE, coverId.longValue())
                : null;

        return new RecommendedBookDto(title, authors, subjects, publishedDate, pageCount, isbn, coverUrl);
    }

    private String encodeParam(String param) {
        return URLEncoder.encode(param, StandardCharsets.UTF_8);
    }
}
