package com.example.minilibrary.discovery;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GoogleBooksClientTest {

    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private GoogleBooksClient googleBooksClient;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(googleBooksClient, "googleBooksApiUrl", "https://mock-api.com");
    }

    @Test
    void getBooksByAuthor_ShouldReturnBooks() {
        Map<String, Object> volumeInfo = Map.of(
                "title", "Book Title",
                "authors", List.of("Author"),
                "pageCount", 200);
        Map<String, Object> item = Map.of("volumeInfo", volumeInfo);
        Map<String, Object> response = Map.of("items", List.of(item));

        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(response);

        var result = googleBooksClient.getBooksByAuthor("Author", 5);
        assertEquals(1, result.size());
        assertEquals("Book Title", result.get(0).title());
    }

    @Test
    void getBooksByCategory_ShouldReturnBooks() {
        Map<String, Object> volumeInfo = Map.of("title", "Cat Book");
        Map<String, Object> item = Map.of("volumeInfo", volumeInfo);
        when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(Map.of("items", List.of(item)));

        var result = googleBooksClient.getBooksByCategory("Fiction", 5);
        assertEquals(1, result.size());
        assertEquals("Cat Book", result.get(0).title());
    }

    @Test
    void getBooksByQuery_ShouldReturnBooks() {
        Map<String, Object> volumeInfo = Map.of("title", "Search Book");
        Map<String, Object> item = Map.of("volumeInfo", volumeInfo);
        when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(Map.of("items", List.of(item)));

        var result = googleBooksClient.getBooksByQuery("Java", 5);
        assertEquals(1, result.size());
        assertEquals("Search Book", result.get(0).title());
    }

    @Test
    void fetchBooks_ShouldReturnEmpty_WhenResponseNull() {
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(null);

        var result = googleBooksClient.getBooksByAuthor("Author", 5);
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchBooks_ShouldReturnEmpty_WhenNoItems() {
        when(restTemplate.getForObject(anyString(), eq(Map.class))).thenReturn(Map.of("totalItems", 0));

        var result = googleBooksClient.getBooksByAuthor("Author", 5);
        assertTrue(result.isEmpty());
    }

    @Test
    void fetchBooks_ShouldReturnEmpty_WhenApiThrows() {
        when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenThrow(new org.springframework.web.client.RestClientException("API error"));

        var result = googleBooksClient.getBooksByAuthor("Author", 5);
        assertTrue(result.isEmpty());
    }

    @Test
    void mapToDto_ShouldExtractCoverUrl() {
        Map<String, Object> volumeInfo = Map.of(
                "title", "Book",
                "imageLinks", Map.of("thumbnail", "http://thumb.jpg"));
        Map<String, Object> item = Map.of("volumeInfo", volumeInfo);
        when(restTemplate.getForObject(anyString(), eq(Map.class)))
                .thenReturn(Map.of("items", List.of(item)));

        var result = googleBooksClient.getBooksByQuery("test", 5);
        assertEquals("http://thumb.jpg", result.get(0).coverUrl());
    }
}
