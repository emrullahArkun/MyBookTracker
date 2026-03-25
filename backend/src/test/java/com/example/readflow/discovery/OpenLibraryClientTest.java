package com.example.readflow.discovery;

import com.example.readflow.discovery.dto.SearchResultDto;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;

class OpenLibraryClientTest {

    private OpenLibraryClient openLibraryClient;
    private MockRestServiceServer mockServer;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        mockServer = MockRestServiceServer.bindTo(builder).build();
        openLibraryClient = new OpenLibraryClient(builder, "ReadFlow-Test (test@example.com)");
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }
    }

    private Map<String, Object> bookDoc(String title, int coverId) {
        return Map.of(
                "title", title,
                "author_name", List.of("Author"),
                "cover_i", coverId);
    }

    private Map<String, Object> bookDocWithIsbn(String title, int coverId, String isbn) {
        return Map.of(
                "title", title,
                "author_name", List.of("Author"),
                "cover_i", coverId,
                "isbn", List.of(isbn));
    }

    private void mockApiResponse(Map<String, Object> response) {
        mockServer.expect(requestTo(org.hamcrest.Matchers.startsWith("https://openlibrary.org/search.json")))
                .andRespond(withSuccess(toJson(response), MediaType.APPLICATION_JSON));
    }

    @Test
    void getBooksByAuthor_ShouldReturnBooks() {
        mockApiResponse(Map.of("docs", List.of(bookDoc("Book Title", 12345))));

        var result = openLibraryClient.getBooksByAuthor("Author", 5);
        assertEquals(1, result.size());
        assertEquals("Book Title", result.get(0).title());
    }

    @Test
    void getBooksByCategory_ShouldReturnBooks() {
        mockApiResponse(Map.of("docs", List.of(bookDoc("Cat Book", 12345))));

        var result = openLibraryClient.getBooksByCategory("Fiction", 5);
        assertEquals(1, result.size());
        assertEquals("Cat Book", result.get(0).title());
    }

    @Test
    void getBooksByQuery_ShouldReturnBooks() {
        mockApiResponse(Map.of("docs", List.of(bookDoc("Search Book", 12345))));

        var result = openLibraryClient.getBooksByQuery("Java", 5);
        assertEquals(1, result.size());
        assertEquals("Search Book", result.get(0).title());
    }

    @Test
    void fetchBooks_ShouldFilterOutBooksWithoutCover() {
        Map<String, Object> withCover = bookDoc("Has Cover", 12345);
        Map<String, Object> noCover = Map.of("title", "No Cover", "author_name", List.of("Author"));

        mockApiResponse(Map.of("docs", List.of(withCover, noCover)));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals(1, result.size());
        assertEquals("Has Cover", result.get(0).title());
    }

    @Test
    void fetchBooks_ShouldReturnEmpty_WhenNoDocs() {
        mockApiResponse(Map.of("numFound", 0));

        var result = openLibraryClient.getBooksByAuthor("Author", 5);
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchBooks_ShouldReturnEmpty_WhenApiThrows() {
        mockServer.expect(requestTo(org.hamcrest.Matchers.startsWith("https://openlibrary.org/search.json")))
                .andRespond(withServerError());

        var result = openLibraryClient.getBooksByAuthor("Author", 5);
        assertTrue(result.isEmpty());
    }

    @Test
    void mapToDto_ShouldBuildCoverUrl() {
        mockApiResponse(Map.of("docs", List.of(bookDoc("Book", 99999))));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals("https://covers.openlibrary.org/b/id/99999-M.jpg", result.get(0).coverUrl());
    }

    @Test
    void mapToDto_ShouldPreferIsbn13() {
        Map<String, Object> doc = Map.of(
                "title", "ISBN Book",
                "cover_i", 12345,
                "isbn", List.of("0123456789", "9781234567890"));

        mockApiResponse(Map.of("docs", List.of(doc)));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals("9781234567890", result.get(0).isbn());
    }

    @Test
    void searchBooks_ShouldReturnBooksWithTotal() {
        mockApiResponse(Map.of(
                "numFound", 42,
                "docs", List.of(bookDocWithIsbn("Found Book", 12345, "9781234567890"))));

        SearchResultDto result = openLibraryClient.searchBooks("test", 0, 10);
        assertEquals(42, result.totalItems());
        assertEquals(1, result.items().size());
        assertEquals("Found Book", result.items().get(0).title());
    }

    @Test
    void searchBooks_ShouldReturnEmptyWithTotal_WhenNoDocs() {
        mockApiResponse(Map.of("numFound", 100));

        SearchResultDto result = openLibraryClient.searchBooks("test", 50, 10);
        assertEquals(100, result.totalItems());
        assertTrue(result.items().isEmpty());
    }

    @Test
    void searchBooks_ShouldReturnEmpty_WhenApiThrows() {
        mockServer.expect(requestTo(org.hamcrest.Matchers.startsWith("https://openlibrary.org/search.json")))
                .andRespond(withServerError());

        SearchResultDto result = openLibraryClient.searchBooks("test", 0, 10);
        assertEquals(0, result.totalItems());
        assertTrue(result.items().isEmpty());
    }

    @Test
    void mapToDto_ShouldHandleMissingOptionalFields() {
        Map<String, Object> doc = Map.of("title", "Minimal", "cover_i", 1);
        mockApiResponse(Map.of("docs", List.of(doc)));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals(1, result.size());
        assertEquals("Minimal", result.get(0).title());
        assertTrue(result.get(0).authors().isEmpty());
        assertNull(result.get(0).isbn());
        assertNull(result.get(0).pageCount());
    }

    @Test
    void mapToDto_ShouldIncludeSubjectsWhenThreeOrFewer() {
        Map<String, Object> doc = new HashMap<>();
        doc.put("title", "Sub Book");
        doc.put("cover_i", 1);
        doc.put("subject", List.of("Fiction", "Drama"));
        mockApiResponse(Map.of("docs", List.of(doc)));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals(List.of("Fiction", "Drama"), result.get(0).categories());
    }

    @Test
    void mapToDto_ShouldLimitSubjectsToThree() {
        Map<String, Object> doc = new HashMap<>();
        doc.put("title", "Many Subjects");
        doc.put("cover_i", 1);
        doc.put("subject", List.of("A", "B", "C", "D", "E"));
        mockApiResponse(Map.of("docs", List.of(doc)));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals(3, result.get(0).categories().size());
    }

    @Test
    void mapToDto_ShouldIncludePublishYear() {
        Map<String, Object> doc = new HashMap<>();
        doc.put("title", "Old Book");
        doc.put("cover_i", 1);
        doc.put("first_publish_year", 1984);
        mockApiResponse(Map.of("docs", List.of(doc)));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals(1984, result.get(0).publishYear());
    }

    @Test
    void mapToDto_ShouldIncludePageCount() {
        Map<String, Object> doc = new HashMap<>();
        doc.put("title", "Thick Book");
        doc.put("cover_i", 1);
        doc.put("number_of_pages_median", 500);
        mockApiResponse(Map.of("docs", List.of(doc)));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals(500, result.get(0).pageCount());
    }

    @Test
    void mapToDto_ShouldFallbackToIsbn10_WhenNoIsbn13() {
        Map<String, Object> doc = new HashMap<>();
        doc.put("title", "ISBN10 Book");
        doc.put("cover_i", 1);
        doc.put("isbn", List.of("0123456789"));
        mockApiResponse(Map.of("docs", List.of(doc)));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals("0123456789", result.get(0).isbn());
    }

    @Test
    void mapToDto_ShouldFallbackToFirstIsbn_WhenNoStandardLength() {
        Map<String, Object> doc = new HashMap<>();
        doc.put("title", "Odd ISBN Book");
        doc.put("cover_i", 1);
        doc.put("isbn", List.of("12345"));
        mockApiResponse(Map.of("docs", List.of(doc)));

        var result = openLibraryClient.getBooksByQuery("test", 5);
        assertEquals("12345", result.get(0).isbn());
    }

    @Test
    void searchBooks_ShouldDefaultTotalToZero_WhenNumFoundMissing() {
        mockApiResponse(Map.of("docs", List.of(bookDoc("Book", 1))));

        SearchResultDto result = openLibraryClient.searchBooks("test", 0, 10);
        assertEquals(0, result.totalItems());
        assertEquals(1, result.items().size());
    }

    @Test
    void searchBooks_ShouldReturnZeroTotal_WhenNoDocsAndNoNumFound() {
        mockApiResponse(Map.of("someKey", "someValue"));

        SearchResultDto result = openLibraryClient.searchBooks("test", 0, 10);
        assertEquals(0, result.totalItems());
        assertTrue(result.items().isEmpty());
    }

    @Test
    void userAgent_ShouldBeSetInRequests() {
        mockServer.expect(requestTo(org.hamcrest.Matchers.startsWith("https://openlibrary.org/search.json")))
                .andExpect(header("User-Agent", "ReadFlow-Test (test@example.com)"))
                .andRespond(withSuccess(toJson(Map.of("docs", List.of())), MediaType.APPLICATION_JSON));

        openLibraryClient.getBooksByQuery("test", 5);
        mockServer.verify();
    }
}
