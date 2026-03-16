package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.discovery.dto.RecommendedBookDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscoveryServiceTest {

    @Mock
    private SearchHistoryRepository searchHistoryRepository;
    @Mock
    private BookRepository bookRepository;
    @Mock
    private GoogleBooksClient googleBooksClient;
    @InjectMocks
    private DiscoveryService discoveryService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
    }

    // --- logSearch ---

    @Test
    void logSearch_ShouldSave_WhenQueryValid() {
        when(searchHistoryRepository.existsByUserAndQueryAndTimestampAfter(eq(user), eq("test"), any()))
                .thenReturn(false);
        when(searchHistoryRepository.countByUser(user)).thenReturn(0L);

        discoveryService.logSearch("test", user);
        verify(searchHistoryRepository).save(any());
    }

    @Test
    void logSearch_ShouldSkip_WhenQueryNull() {
        discoveryService.logSearch(null, user);
        verify(searchHistoryRepository, never()).save(any());
    }

    @Test
    void logSearch_ShouldSkip_WhenQueryEmpty() {
        discoveryService.logSearch("   ", user);
        verify(searchHistoryRepository, never()).save(any());
    }

    @Test
    void logSearch_ShouldSkip_WhenDuplicate() {
        when(searchHistoryRepository.existsByUserAndQueryAndTimestampAfter(eq(user), eq("test"), any()))
                .thenReturn(true);

        discoveryService.logSearch("test", user);
        verify(searchHistoryRepository, never()).save(any());
    }

    @Test
    void logSearch_ShouldDeleteOldest_WhenOverLimit() {
        when(searchHistoryRepository.existsByUserAndQueryAndTimestampAfter(eq(user), eq("test"), any()))
                .thenReturn(false);
        when(searchHistoryRepository.countByUser(user)).thenReturn(50L);

        discoveryService.logSearch("test", user);
        verify(searchHistoryRepository).deleteOldestByUserId(user.getId());
        verify(searchHistoryRepository).save(any());
    }

    // --- getTopAuthors ---

    @Test
    void getTopAuthors_ShouldReturnLimitedList() {
        when(bookRepository.findTopAuthorsByUser(user)).thenReturn(List.of("A", "B", "C", "D"));

        List<String> result = discoveryService.getTopAuthors(user, 2);
        assertEquals(2, result.size());
        assertEquals("A", result.get(0));
    }

    // --- getTopCategories ---

    @Test
    void getTopCategories_ShouldParseAndSort() {
        when(bookRepository.findAllCategoriesByUser(user))
                .thenReturn(List.of("Thriller, Krimi", "Thriller", "Sci-Fi"));

        List<String> result = discoveryService.getTopCategories(user, 2);
        assertEquals(2, result.size());
        assertEquals("Thriller", result.get(0)); // count 2
    }

    // --- getRecentSearches ---

    @Test
    void getRecentSearches_ShouldReturnLimitedList() {
        when(searchHistoryRepository.findDistinctQueriesByUserOrderByTimestampDesc(user))
                .thenReturn(List.of("q1", "q2", "q3"));

        List<String> result = discoveryService.getRecentSearches(user, 2);
        assertEquals(2, result.size());
    }

    // --- recommendations ---

    @Test
    void getRecommendationsByAuthor_ShouldReturnBooks() {
        Set<String> ownedIsbns = new HashSet<>(List.of("owned123"));

        RecommendedBookDto book = new RecommendedBookDto(
                "Book Title", List.of("Author"), null, null, 200, "isbn456", null);

        when(googleBooksClient.getBooksByAuthor("Author", 5)).thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByAuthor("Author", ownedIsbns, 5);
        assertEquals(1, result.size());
        assertEquals("Book Title", result.get(0).title());
    }

    @Test
    void getRecommendationsByAuthor_ShouldExcludeOwnedBooks() {
        Set<String> ownedIsbns = new HashSet<>(List.of("isbn123"));

        RecommendedBookDto book = new RecommendedBookDto(
                "Owned Book", List.of("Author"), null, null, 200, "isbn123", null);

        when(googleBooksClient.getBooksByAuthor("Author", 5)).thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByAuthor("Author", ownedIsbns, 5);
        assertEquals(0, result.size());
    }

    @Test
    void getRecommendationsByCategory_ShouldReturnBooks() {
        Set<String> ownedIsbns = new HashSet<>();

        RecommendedBookDto book = new RecommendedBookDto(
                "Cat Book", null, null, null, null, null, null);

        when(googleBooksClient.getBooksByCategory("Fiction", 5)).thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByCategory("Fiction", ownedIsbns, 5);
        assertEquals(1, result.size());
    }

    @Test
    void getRecommendationsByQuery_ShouldReturnBooks() {
        Set<String> ownedIsbns = new HashSet<>();

        RecommendedBookDto book = new RecommendedBookDto(
                "Search Book", null, null, null, null, null, null);

        when(googleBooksClient.getBooksByQuery("Java", 5)).thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByQuery("Java", ownedIsbns, 5);
        assertEquals(1, result.size());
    }

    // --- getOwnedIsbns ---

    @Test
    void getOwnedIsbns_ShouldReturnSet() {
        when(bookRepository.findAllIsbnsByUser(user)).thenReturn(List.of("isbn1", "isbn2"));

        Set<String> result = discoveryService.getOwnedIsbns(user);
        assertEquals(2, result.size());
        assertTrue(result.contains("isbn1"));
    }
}
