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

import org.springframework.data.domain.PageRequest;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DiscoveryServiceTest {

    @Mock
    private SearchHistoryService searchHistoryService;
    @Mock
    private BookRepository bookRepository;
    @Mock
    private OpenLibraryClient openLibraryClient;
    @InjectMocks
    private DiscoveryService discoveryService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
    }

    // --- getTopAuthors ---

    @Test
    void getTopAuthors_ShouldReturnLimitedList() {
        when(bookRepository.findTopAuthorsByUser(user, PageRequest.of(0, 2)))
                .thenReturn(List.of("A", "B"));

        List<String> result = discoveryService.getTopAuthors(user, 2);
        assertEquals(2, result.size());
        assertEquals("A", result.get(0));
    }

    // --- getTopCategories ---

    @Test
    void getTopCategories_ShouldReturnLimitedList() {
        when(bookRepository.findTopCategoriesByUser(user, PageRequest.of(0, 2)))
                .thenReturn(List.of("Thriller", "Krimi"));

        List<String> result = discoveryService.getTopCategories(user, 2);
        assertEquals(2, result.size());
        assertEquals("Thriller", result.get(0));
    }

    // --- recommendations ---

    @Test
    void getRecommendationsByAuthor_ShouldReturnBooks() {
        Set<String> ownedIsbns = new HashSet<>(List.of("owned123"));

        RecommendedBookDto book = new RecommendedBookDto(
                "Book Title", List.of("Author"), null, null, 200, "isbn456", null);

        when(openLibraryClient.getBooksByAuthor("Author", 5)).thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByAuthor("Author", ownedIsbns, 5);
        assertEquals(1, result.size());
        assertEquals("Book Title", result.get(0).title());
    }

    @Test
    void getRecommendationsByAuthor_ShouldExcludeOwnedBooks() {
        Set<String> ownedIsbns = new HashSet<>(List.of("isbn123"));

        RecommendedBookDto book = new RecommendedBookDto(
                "Owned Book", List.of("Author"), null, null, 200, "isbn123", null);

        when(openLibraryClient.getBooksByAuthor("Author", 5)).thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByAuthor("Author", ownedIsbns, 5);
        assertEquals(0, result.size());
    }

    @Test
    void getRecommendationsByCategory_ShouldReturnBooks() {
        Set<String> ownedIsbns = new HashSet<>();

        RecommendedBookDto book = new RecommendedBookDto(
                "Cat Book", null, null, null, null, null, null);

        when(openLibraryClient.getBooksByCategory("Fiction", 5)).thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByCategory("Fiction", ownedIsbns, 5);
        assertEquals(1, result.size());
    }

    @Test
    void getRecommendationsByQuery_ShouldReturnBooks() {
        Set<String> ownedIsbns = new HashSet<>();

        RecommendedBookDto book = new RecommendedBookDto(
                "Search Book", null, null, null, null, null, null);

        when(openLibraryClient.getBooksByQuery("Java", 5)).thenReturn(List.of(book));

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

    // --- Sections ---

    @Test
    void getAuthorSection_ShouldReturnEmpty_WhenNoAuthors() {
        when(bookRepository.findTopAuthorsByUser(eq(user), any())).thenReturn(List.of());

        var result = discoveryService.getAuthorSection(user, Set.of());
        assertTrue(result.authors().isEmpty());
        assertTrue(result.books().isEmpty());
    }

    @Test
    void getAuthorSection_ShouldReturnBooks_WhenAuthorsExist() {
        when(bookRepository.findTopAuthorsByUser(eq(user), any())).thenReturn(List.of("Author1"));
        RecommendedBookDto book = new RecommendedBookDto("Book1", null, null, null, null, null, null);
        when(openLibraryClient.getBooksByAuthor("Author1", 10)).thenReturn(List.of(book));

        var result = discoveryService.getAuthorSection(user, Set.of());
        assertEquals(List.of("Author1"), result.authors());
        assertEquals(1, result.books().size());
    }

    @Test
    void getCategorySection_ShouldReturnEmpty_WhenNoCategories() {
        when(bookRepository.findTopCategoriesByUser(eq(user), any())).thenReturn(List.of());

        var result = discoveryService.getCategorySection(user, Set.of());
        assertTrue(result.categories().isEmpty());
        assertTrue(result.books().isEmpty());
    }

    @Test
    void getCategorySection_ShouldReturnBooks_WhenCategoriesExist() {
        when(bookRepository.findTopCategoriesByUser(eq(user), any())).thenReturn(List.of("Cat1"));
        RecommendedBookDto book = new RecommendedBookDto("Book1", null, null, null, null, null, null);
        when(openLibraryClient.getBooksByCategory("Cat1", 10)).thenReturn(List.of(book));

        var result = discoveryService.getCategorySection(user, Set.of());
        assertEquals(List.of("Cat1"), result.categories());
        assertEquals(1, result.books().size());
    }

    @Test
    void getSearchSection_ShouldReturnEmpty_WhenNoSearches() {
        when(searchHistoryService.getRecentSearches(eq(user), anyInt())).thenReturn(List.of());

        var result = discoveryService.getSearchSection(user, Set.of());
        assertTrue(result.queries().isEmpty());
        assertTrue(result.books().isEmpty());
    }

    @Test
    void getSearchSection_ShouldReturnBooks_WhenSearchesExist() {
        when(searchHistoryService.getRecentSearches(eq(user), anyInt())).thenReturn(List.of("query1"));
        RecommendedBookDto book = new RecommendedBookDto("Book1", null, null, null, null, null, null);
        when(openLibraryClient.getBooksByQuery("query1", 10)).thenReturn(List.of(book));

        var result = discoveryService.getSearchSection(user, Set.of());
        assertEquals(List.of("query1"), result.queries());
        assertEquals(1, result.books().size());
    }

    @Test
    void getDiscoveryData_ShouldHandleEmptyData() {
        when(bookRepository.findAllIsbnsByUser(user)).thenReturn(List.of());
        when(bookRepository.findTopAuthorsByUser(eq(user), any())).thenReturn(List.of());
        when(bookRepository.findTopCategoriesByUser(eq(user), any())).thenReturn(List.of());
        when(searchHistoryService.getRecentSearches(eq(user), anyInt())).thenReturn(List.of());

        var result = discoveryService.getDiscoveryData(user);
        assertTrue(result.byAuthor().authors().isEmpty());
        assertTrue(result.byAuthor().books().isEmpty());
        assertTrue(result.byCategory().categories().isEmpty());
        assertTrue(result.byCategory().books().isEmpty());
        assertTrue(result.bySearch().queries().isEmpty());
        assertTrue(result.bySearch().books().isEmpty());
    }

    @Test
    void getDiscoveryData_ShouldReturnAllSections() {
        when(bookRepository.findAllIsbnsByUser(user)).thenReturn(List.of());
        when(bookRepository.findTopAuthorsByUser(eq(user), any())).thenReturn(List.of("Author1"));
        when(bookRepository.findTopCategoriesByUser(eq(user), any())).thenReturn(List.of("Cat1"));
        when(searchHistoryService.getRecentSearches(eq(user), anyInt())).thenReturn(List.of("query1"));

        RecommendedBookDto book = new RecommendedBookDto("Book1", null, null, null, null, null, null);
        when(openLibraryClient.getBooksByAuthor("Author1", 10)).thenReturn(List.of(book));
        when(openLibraryClient.getBooksByCategory("Cat1", 10)).thenReturn(List.of(book));
        when(openLibraryClient.getBooksByQuery("query1", 10)).thenReturn(List.of(book));

        var result = discoveryService.getDiscoveryData(user);
        assertEquals(List.of("Author1"), result.byAuthor().authors());
        assertEquals(1, result.byAuthor().books().size());
        assertEquals(List.of("Cat1"), result.byCategory().categories());
        assertEquals(1, result.byCategory().books().size());
        assertEquals(List.of("query1"), result.bySearch().queries());
        assertEquals(1, result.bySearch().books().size());
    }
}
