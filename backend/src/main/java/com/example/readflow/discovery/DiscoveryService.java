package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import com.example.readflow.discovery.dto.DiscoveryResponse;
import com.example.readflow.discovery.dto.RecommendedBookDto;
import com.example.readflow.discovery.dto.SearchResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadLocalRandom;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DiscoveryService {

    private final DiscoveryUserDataService userDataService;
    private final DiscoveryRecommendationService recommendationService;
    private final ExecutorService ioExecutor;

    public Set<String> getOwnedIsbns(User user) {
        return userDataService.getOwnedIsbns(user);
    }

    List<String> getTopAuthors(User user, int limit) {
        return userDataService.getTopAuthors(user, limit);
    }

    List<String> getTopCategories(User user, int limit) {
        return userDataService.getTopCategories(user, limit);
    }

    List<RecommendedBookDto> getRecommendationsByAuthor(String author, Set<String> ownedIsbns, int maxResults) {
        return recommendationService.getRecommendationsByAuthor(author, ownedIsbns, maxResults);
    }

    List<RecommendedBookDto> getRecommendationsByCategory(String category, Set<String> ownedIsbns,
            int maxResults) {
        return recommendationService.getRecommendationsByCategory(category, ownedIsbns, maxResults);
    }

    List<RecommendedBookDto> getRecommendationsByQuery(String query, Set<String> ownedIsbns, int maxResults) {
        return recommendationService.getRecommendationsByQuery(query, ownedIsbns, maxResults);
    }

    public SearchResultDto searchBooks(String query, Set<String> ownedIsbns, int startIndex, int maxResults) {
        return recommendationService.searchBooks(query, ownedIsbns, startIndex, maxResults);
    }

    private static final int DEFAULT_LIMIT = 5;
    private static final int MAX_RESULTS = 10;

    private static <T> T pickRandomOrNull(List<T> list) {
        return list.isEmpty() ? null : list.get(ThreadLocalRandom.current().nextInt(list.size()));
    }

    public DiscoveryResponse.AuthorSection getAuthorSection(User user, Set<String> ownedIsbns) {
        List<String> topAuthors = getTopAuthors(user, 3);
        String selected = pickRandomOrNull(topAuthors);
        List<RecommendedBookDto> books = selected == null
                ? Collections.emptyList()
                : getRecommendationsByAuthor(selected, ownedIsbns, MAX_RESULTS);
        return new DiscoveryResponse.AuthorSection(topAuthors, books);
    }

    public DiscoveryResponse.CategorySection getCategorySection(User user, Set<String> ownedIsbns) {
        List<String> topCategories = getTopCategories(user, 3);
        String selected = pickRandomOrNull(topCategories);
        List<RecommendedBookDto> books = selected == null
                ? Collections.emptyList()
                : getRecommendationsByCategory(selected, ownedIsbns, MAX_RESULTS);
        return new DiscoveryResponse.CategorySection(topCategories, books);
    }

    public DiscoveryResponse.SearchSection getSearchSection(User user, Set<String> ownedIsbns) {
        List<String> recentSearches = userDataService.getRecentSearches(user, DEFAULT_LIMIT);
        String selected = pickRandomOrNull(recentSearches);
        List<RecommendedBookDto> books = selected == null
                ? Collections.emptyList()
                : getRecommendationsByQuery(selected, ownedIsbns, MAX_RESULTS);
        return new DiscoveryResponse.SearchSection(recentSearches, books);
    }

    public DiscoveryResponse getDiscoveryData(User user) {
        DiscoverySnapshot snapshot = userDataService.getSnapshot(user, 3, DEFAULT_LIMIT);
        String selectedAuthor = pickRandomOrNull(snapshot.topAuthors());
        String selectedCategory = pickRandomOrNull(snapshot.topCategories());
        String selectedSearch = pickRandomOrNull(snapshot.recentSearches());

        CompletableFuture<List<RecommendedBookDto>> authorBooksFuture = fetchRecommendationsAsync(
                "author", selectedAuthor,
                () -> getRecommendationsByAuthor(selectedAuthor, snapshot.ownedIsbns(), MAX_RESULTS));
        CompletableFuture<List<RecommendedBookDto>> categoryBooksFuture = fetchRecommendationsAsync(
                "category", selectedCategory,
                () -> getRecommendationsByCategory(selectedCategory, snapshot.ownedIsbns(), MAX_RESULTS));
        CompletableFuture<List<RecommendedBookDto>> searchBooksFuture = fetchRecommendationsAsync(
                "search", selectedSearch,
                () -> getRecommendationsByQuery(selectedSearch, snapshot.ownedIsbns(), MAX_RESULTS));

        CompletableFuture.allOf(authorBooksFuture, categoryBooksFuture, searchBooksFuture).join();

        return new DiscoveryResponse(
                new DiscoveryResponse.AuthorSection(snapshot.topAuthors(), authorBooksFuture.join()),
                new DiscoveryResponse.CategorySection(snapshot.topCategories(), categoryBooksFuture.join()),
                new DiscoveryResponse.SearchSection(snapshot.recentSearches(), searchBooksFuture.join()));
    }

    private CompletableFuture<List<RecommendedBookDto>> fetchRecommendationsAsync(
            String source,
            String seed,
            Supplier<List<RecommendedBookDto>> supplier) {
        return CompletableFuture.supplyAsync(() -> seed == null ? Collections.<RecommendedBookDto>emptyList() : supplier.get(),
                        ioExecutor)
                .exceptionally(e -> {
                    log.error("Failed to fetch {} recommendations for {}: {}", source, seed, e.getMessage());
                    return Collections.emptyList();
                });
    }
}
