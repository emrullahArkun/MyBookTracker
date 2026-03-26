package com.example.readflow.discovery.application;

import com.example.readflow.auth.domain.User;
import com.example.readflow.discovery.domain.DiscoveryBook;
import com.example.readflow.discovery.domain.DiscoverySnapshot;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DiscoveryServiceTest {

    @Mock
    private DiscoveryUserDataService userDataService;

    @Mock
    private DiscoveryRecommendationService recommendationService;

    private DiscoverySectionsService discoverySectionsService;
    private DiscoveryService discoveryService;
    private User user;

    @BeforeEach
    void setUp() {
        discoverySectionsService = new DiscoverySectionsService(
                userDataService,
                recommendationService,
                Executors.newVirtualThreadPerTaskExecutor());
        discoveryService = new DiscoveryService(
                userDataService,
                recommendationService,
                discoverySectionsService);
        user = new User();
        user.setId(1L);
    }

    @Test
    void getTopAuthors_ShouldReturnLimitedList() {
        when(userDataService.getTopAuthors(user, 2)).thenReturn(List.of("A", "B"));

        List<String> result = discoveryService.getTopAuthors(user, 2);

        assertEquals(2, result.size());
        assertEquals("A", result.get(0));
    }

    @Test
    void getTopCategories_ShouldReturnLimitedList() {
        when(userDataService.getTopCategories(user, 2)).thenReturn(List.of("Thriller", "Krimi"));

        List<String> result = discoveryService.getTopCategories(user, 2);

        assertEquals(2, result.size());
        assertEquals("Thriller", result.get(0));
    }

    @Test
    void getRecommendationsByAuthor_ShouldDelegate() {
        DiscoveryBook book = new DiscoveryBook("Book Title", List.of("Author"), null, null, 200, "isbn456", null);
        when(recommendationService.getRecommendationsByAuthor("Author", Set.of("owned123"), 5))
                .thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByAuthor("Author", Set.of("owned123"), 5);

        assertEquals(1, result.size());
        assertEquals("Book Title", result.get(0).title());
    }

    @Test
    void getRecommendationsByCategory_ShouldDelegate() {
        DiscoveryBook book = new DiscoveryBook("Cat Book", null, null, null, null, null, null);
        when(recommendationService.getRecommendationsByCategory("Fiction", Set.of(), 5))
                .thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByCategory("Fiction", Set.of(), 5);

        assertEquals(1, result.size());
    }

    @Test
    void getRecommendationsByQuery_ShouldDelegate() {
        DiscoveryBook book = new DiscoveryBook("Search Book", null, null, null, null, null, null);
        when(recommendationService.getRecommendationsByQuery("Java", Set.of(), 5))
                .thenReturn(List.of(book));

        var result = discoveryService.getRecommendationsByQuery("Java", Set.of(), 5);

        assertEquals(1, result.size());
    }

    @Test
    void getOwnedIsbns_ShouldReturnSet() {
        when(userDataService.getOwnedIsbns(user)).thenReturn(Set.of("isbn1", "isbn2"));

        Set<String> result = discoveryService.getOwnedIsbns(user);

        assertEquals(2, result.size());
        assertTrue(result.contains("isbn1"));
    }

    @Test
    void getAuthorSection_ShouldReturnEmpty_WhenNoAuthors() {
        when(userDataService.getTopAuthors(eq(user), anyInt())).thenReturn(List.of());

        var result = discoveryService.getAuthorSection(user);

        assertTrue(result.authors().isEmpty());
        assertTrue(result.books().isEmpty());
    }

    @Test
    void getAuthorSection_ShouldReturnBooks_WhenAuthorsExist() {
        DiscoveryBook book = new DiscoveryBook("Book1", null, null, null, null, null, null);
        when(userDataService.getTopAuthors(eq(user), anyInt())).thenReturn(List.of("Author1"));
        when(recommendationService.getRecommendationsByAuthor("Author1", Set.of(), 10)).thenReturn(List.of(book));

        when(userDataService.getOwnedIsbns(user)).thenReturn(Set.of());

        var result = discoveryService.getAuthorSection(user);

        assertEquals(List.of("Author1"), result.authors());
        assertEquals(1, result.books().size());
    }

    @Test
    void getCategorySection_ShouldReturnEmpty_WhenNoCategories() {
        when(userDataService.getTopCategories(eq(user), anyInt())).thenReturn(List.of());

        var result = discoveryService.getCategorySection(user);

        assertTrue(result.categories().isEmpty());
        assertTrue(result.books().isEmpty());
    }

    @Test
    void getCategorySection_ShouldReturnBooks_WhenCategoriesExist() {
        DiscoveryBook book = new DiscoveryBook("Book1", null, null, null, null, null, null);
        when(userDataService.getTopCategories(eq(user), anyInt())).thenReturn(List.of("Cat1"));
        when(recommendationService.getRecommendationsByCategory("Cat1", Set.of(), 10)).thenReturn(List.of(book));

        when(userDataService.getOwnedIsbns(user)).thenReturn(Set.of());

        var result = discoveryService.getCategorySection(user);

        assertEquals(List.of("Cat1"), result.categories());
        assertEquals(1, result.books().size());
    }

    @Test
    void getSearchSection_ShouldReturnEmpty_WhenNoSearches() {
        when(userDataService.getRecentSearches(eq(user), anyInt())).thenReturn(List.of());

        var result = discoveryService.getSearchSection(user);

        assertTrue(result.queries().isEmpty());
        assertTrue(result.books().isEmpty());
    }

    @Test
    void getSearchSection_ShouldReturnBooks_WhenSearchesExist() {
        DiscoveryBook book = new DiscoveryBook("Book1", null, null, null, null, null, null);
        when(userDataService.getRecentSearches(eq(user), anyInt())).thenReturn(List.of("query1"));
        when(recommendationService.getRecommendationsByQuery("query1", Set.of(), 10)).thenReturn(List.of(book));

        when(userDataService.getOwnedIsbns(user)).thenReturn(Set.of());

        var result = discoveryService.getSearchSection(user);

        assertEquals(List.of("query1"), result.queries());
        assertEquals(1, result.books().size());
    }

    @Test
    void getDiscoveryData_ShouldHandleEmptyData() {
        when(userDataService.getSnapshot(user, 3, 5))
                .thenReturn(new DiscoverySnapshot(Set.of(), List.of(), List.of(), List.of()));

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
        DiscoveryBook book = new DiscoveryBook("Book1", null, null, null, null, null, null);
        when(userDataService.getSnapshot(user, 3, 5))
                .thenReturn(new DiscoverySnapshot(Set.of(), List.of("Author1"), List.of("Cat1"), List.of("query1")));
        when(recommendationService.getRecommendationsByAuthor("Author1", Set.of(), 10)).thenReturn(List.of(book));
        when(recommendationService.getRecommendationsByCategory("Cat1", Set.of(), 10)).thenReturn(List.of(book));
        when(recommendationService.getRecommendationsByQuery("query1", Set.of(), 10)).thenReturn(List.of(book));

        var result = discoveryService.getDiscoveryData(user);

        assertEquals(List.of("Author1"), result.byAuthor().authors());
        assertEquals(1, result.byAuthor().books().size());
        assertEquals(List.of("Cat1"), result.byCategory().categories());
        assertEquals(1, result.byCategory().books().size());
        assertEquals(List.of("query1"), result.bySearch().queries());
        assertEquals(1, result.bySearch().books().size());
    }

    @Test
    void getDiscoveryData_ShouldReturnEmptyBooks_WhenRecommendationTimesOut() {
        when(userDataService.getSnapshot(user, 3, 5))
                .thenReturn(new DiscoverySnapshot(Set.of(), List.of("Author1"), List.of(), List.of()));
        when(recommendationService.getRecommendationsByAuthor("Author1", Set.of(), 10))
                .thenAnswer(invocation -> {
                    Thread.sleep(100);
                    return List.of(new DiscoveryBook("Slow Book", null, null, null, null, null, null));
                });

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            DiscoverySectionsService timeoutSectionsService = new DiscoverySectionsService(
                    userDataService,
                    recommendationService,
                    executor,
                    10L);
            DiscoveryService timeoutDiscoveryService = new DiscoveryService(
                    userDataService,
                    recommendationService,
                    timeoutSectionsService);

            var result = assertTimeoutPreemptively(
                    Duration.ofMillis(250),
                    () -> timeoutDiscoveryService.getDiscoveryData(user));

            assertEquals(List.of("Author1"), result.byAuthor().authors());
            assertTrue(result.byAuthor().books().isEmpty());
            assertTrue(result.byCategory().books().isEmpty());
            assertTrue(result.bySearch().books().isEmpty());
        }
    }
}
