package com.example.readflow.discovery.application;

import com.example.readflow.auth.domain.User;
import com.example.readflow.discovery.domain.DiscoveryBook;
import com.example.readflow.discovery.domain.DiscoverySnapshot;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

@Service
@Slf4j
@Transactional(readOnly = true)
class DiscoverySectionsService {

    private static final int DEFAULT_LIMIT = 5;
    private static final int MAX_RESULTS = 10;
    private static final long DEFAULT_RECOMMENDATION_TIMEOUT_MILLIS = 1500L;

    private final DiscoveryUserDataService userDataService;
    private final DiscoveryRecommendationService recommendationService;
    private final ExecutorService ioExecutor;
    private final long recommendationTimeoutMillis;

    @Autowired
    DiscoverySectionsService(
            DiscoveryUserDataService userDataService,
            DiscoveryRecommendationService recommendationService,
            ExecutorService ioExecutor) {
        this(userDataService, recommendationService, ioExecutor, DEFAULT_RECOMMENDATION_TIMEOUT_MILLIS);
    }

    DiscoverySectionsService(
            DiscoveryUserDataService userDataService,
            DiscoveryRecommendationService recommendationService,
            ExecutorService ioExecutor,
            long recommendationTimeoutMillis) {
        this.userDataService = userDataService;
        this.recommendationService = recommendationService;
        this.ioExecutor = ioExecutor;
        this.recommendationTimeoutMillis = recommendationTimeoutMillis;
    }

    public AuthorRecommendations getAuthorSection(User user) {
        List<String> topAuthors = userDataService.getTopAuthors(user, 3);
        String selectedAuthor = pickRandomOrNull(topAuthors);
        List<DiscoveryBook> books = selectedAuthor == null
                ? Collections.emptyList()
                : recommendationService.getRecommendationsByAuthor(selectedAuthor, userDataService.getOwnedIsbns(user), MAX_RESULTS);
        return new AuthorRecommendations(topAuthors, books);
    }

    public CategoryRecommendations getCategorySection(User user) {
        List<String> topCategories = userDataService.getTopCategories(user, 3);
        String selectedCategory = pickRandomOrNull(topCategories);
        List<DiscoveryBook> books = selectedCategory == null
                ? Collections.emptyList()
                : recommendationService.getRecommendationsByCategory(selectedCategory, userDataService.getOwnedIsbns(user), MAX_RESULTS);
        return new CategoryRecommendations(topCategories, books);
    }

    public SearchRecommendations getSearchSection(User user) {
        List<String> recentSearches = userDataService.getRecentSearches(user, DEFAULT_LIMIT);
        String selectedSearch = pickRandomOrNull(recentSearches);
        List<DiscoveryBook> books = selectedSearch == null
                ? Collections.emptyList()
                : recommendationService.getRecommendationsByQuery(selectedSearch, userDataService.getOwnedIsbns(user), MAX_RESULTS);
        return new SearchRecommendations(recentSearches, books);
    }

    public DiscoveryData getDiscoveryData(User user) {
        DiscoverySnapshot snapshot = userDataService.getSnapshot(user, 3, DEFAULT_LIMIT);
        String selectedAuthor = pickRandomOrNull(snapshot.topAuthors());
        String selectedCategory = pickRandomOrNull(snapshot.topCategories());
        String selectedSearch = pickRandomOrNull(snapshot.recentSearches());

        CompletableFuture<List<DiscoveryBook>> authorBooksFuture = fetchRecommendationsAsync(
                "author",
                selectedAuthor,
                () -> recommendationService.getRecommendationsByAuthor(selectedAuthor, snapshot.ownedIsbns(), MAX_RESULTS));
        CompletableFuture<List<DiscoveryBook>> categoryBooksFuture = fetchRecommendationsAsync(
                "category",
                selectedCategory,
                () -> recommendationService.getRecommendationsByCategory(selectedCategory, snapshot.ownedIsbns(), MAX_RESULTS));
        CompletableFuture<List<DiscoveryBook>> searchBooksFuture = fetchRecommendationsAsync(
                "search",
                selectedSearch,
                () -> recommendationService.getRecommendationsByQuery(selectedSearch, snapshot.ownedIsbns(), MAX_RESULTS));

        CompletableFuture.allOf(authorBooksFuture, categoryBooksFuture, searchBooksFuture).join();

        return new DiscoveryData(
                new AuthorRecommendations(snapshot.topAuthors(), authorBooksFuture.join()),
                new CategoryRecommendations(snapshot.topCategories(), categoryBooksFuture.join()),
                new SearchRecommendations(snapshot.recentSearches(), searchBooksFuture.join()));
    }

    private static <T> T pickRandomOrNull(List<T> values) {
        return values.isEmpty() ? null : values.get(ThreadLocalRandom.current().nextInt(values.size()));
    }

    private CompletableFuture<List<DiscoveryBook>> fetchRecommendationsAsync(
            String source,
            String seed,
            Supplier<List<DiscoveryBook>> supplier) {
        return CompletableFuture.supplyAsync(() -> seed == null ? Collections.<DiscoveryBook>emptyList() : supplier.get(),
                        ioExecutor)
                .completeOnTimeout(Collections.emptyList(), recommendationTimeoutMillis, TimeUnit.MILLISECONDS)
                .exceptionally(error -> {
                    log.error("Failed to fetch {} recommendations", source, error);
                    return Collections.emptyList();
                });
    }
}
