package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.discovery.dto.DiscoveryResponse;
import com.example.readflow.discovery.dto.RecommendedBookDto;
import com.example.readflow.discovery.dto.SearchResultDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class DiscoveryService {

    private static final int MAX_SEARCH_HISTORY_PER_USER = 50;
    private static final int DEDUPLICATION_MINUTES = 5;

    private final SearchHistoryRepository searchHistoryRepository;
    private final BookRepository bookRepository;
    private final OpenLibraryClient openLibraryClient;

    @Transactional
    public void logSearch(String query, User user) {
        if (query == null || query.trim().isEmpty()) {
            return;
        }

        String trimmedQuery = query.trim();

        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(DEDUPLICATION_MINUTES);
        if (searchHistoryRepository.existsByUserAndQueryAndTimestampAfter(user, trimmedQuery, cutoff)) {
            log.debug("Skipping duplicate search log for query: {}", trimmedQuery);
            return;
        }

        if (searchHistoryRepository.countByUser(user) >= MAX_SEARCH_HISTORY_PER_USER) {
            searchHistoryRepository.deleteOldestByUserId(user.getId());
        }

        SearchHistory history = SearchHistory.builder()
                .query(trimmedQuery)
                .user(user)
                .build();
        searchHistoryRepository.save(history);
    }

    public Set<String> getOwnedIsbns(User user) {
        return new HashSet<>(bookRepository.findAllIsbnsByUser(user));
    }

    public List<String> getTopAuthors(User user, int limit) {
        return bookRepository.findTopAuthorsByUser(user, PageRequest.of(0, limit));
    }

    public List<String> getTopCategories(User user, int limit) {
        return bookRepository.findTopCategoriesByUser(user, PageRequest.of(0, limit));
    }

    public List<String> getRecentSearches(User user, int limit) {
        return searchHistoryRepository.findDistinctQueriesByUserOrderByTimestampDesc(user)
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<RecommendedBookDto> getRecommendationsByAuthor(String author, Set<String> ownedIsbns, int maxResults) {
        return filterOwnedBooks(openLibraryClient.getBooksByAuthor(author, maxResults), ownedIsbns);
    }

    public List<RecommendedBookDto> getRecommendationsByCategory(String category, Set<String> ownedIsbns,
            int maxResults) {
        return filterOwnedBooks(openLibraryClient.getBooksByCategory(category, maxResults), ownedIsbns);
    }

    public List<RecommendedBookDto> getRecommendationsByQuery(String query, Set<String> ownedIsbns, int maxResults) {
        return filterOwnedBooks(openLibraryClient.getBooksByQuery(query, maxResults), ownedIsbns);
    }

    public SearchResultDto searchBooks(String query, Set<String> ownedIsbns, int startIndex, int maxResults) {
        SearchResultDto result = openLibraryClient.searchBooks(query, startIndex, maxResults);
        List<RecommendedBookDto> filtered = filterOwnedBooks(result.items(), ownedIsbns);
        return new SearchResultDto(filtered, result.totalItems());
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
        List<String> recentSearches = getRecentSearches(user, DEFAULT_LIMIT);
        String selected = pickRandomOrNull(recentSearches);
        List<RecommendedBookDto> books = selected == null
                ? Collections.emptyList()
                : getRecommendationsByQuery(selected, ownedIsbns, MAX_RESULTS);
        return new DiscoveryResponse.SearchSection(recentSearches, books);
    }

    public DiscoveryResponse getDiscoveryData(User user) {
        // Alle DB-Aufrufe synchron im Haupt-Thread (Hibernate-Session ist Thread-gebunden)
        Set<String> ownedIsbns = getOwnedIsbns(user);
        List<String> topAuthors = getTopAuthors(user, 3);
        String selectedAuthor = pickRandomOrNull(topAuthors);
        List<String> topCategories = getTopCategories(user, 3);
        String selectedCategory = pickRandomOrNull(topCategories);
        List<String> recentSearches = getRecentSearches(user, DEFAULT_LIMIT);
        String selectedSearch = pickRandomOrNull(recentSearches);

        // Nur die langsamen externen API-Aufrufe parallelisieren
        CompletableFuture<List<RecommendedBookDto>> authorBooksFuture = CompletableFuture.supplyAsync(() ->
                selectedAuthor == null ? Collections.emptyList()
                        : getRecommendationsByAuthor(selectedAuthor, ownedIsbns, MAX_RESULTS));
        CompletableFuture<List<RecommendedBookDto>> categoryBooksFuture = CompletableFuture.supplyAsync(() ->
                selectedCategory == null ? Collections.emptyList()
                        : getRecommendationsByCategory(selectedCategory, ownedIsbns, MAX_RESULTS));
        CompletableFuture<List<RecommendedBookDto>> searchBooksFuture = CompletableFuture.supplyAsync(() ->
                selectedSearch == null ? Collections.emptyList()
                        : getRecommendationsByQuery(selectedSearch, ownedIsbns, MAX_RESULTS));

        CompletableFuture.allOf(authorBooksFuture, categoryBooksFuture, searchBooksFuture).join();

        return new DiscoveryResponse(
                new DiscoveryResponse.AuthorSection(topAuthors, authorBooksFuture.join()),
                new DiscoveryResponse.CategorySection(topCategories, categoryBooksFuture.join()),
                new DiscoveryResponse.SearchSection(recentSearches, searchBooksFuture.join()));
    }

    private List<RecommendedBookDto> filterOwnedBooks(List<RecommendedBookDto> books, Set<String> ownedIsbns) {
        return books.stream()
                .filter(book -> book.isbn() == null || !ownedIsbns.contains(book.isbn()))
                .collect(Collectors.toList());
    }
}
