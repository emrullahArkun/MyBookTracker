package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.discovery.dto.RecommendedBookDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DiscoveryService {

    private static final int MAX_SEARCH_HISTORY_PER_USER = 50;
    private static final int DEDUPLICATION_MINUTES = 5;

    private final SearchHistoryRepository searchHistoryRepository;
    private final BookRepository bookRepository;
    private final GoogleBooksClient googleBooksClient;

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
        List<String> authors = bookRepository.findTopAuthorsByUser(user);
        return authors.stream().limit(limit).collect(Collectors.toList());
    }

    public List<String> getTopCategories(User user, int limit) {
        List<String> allCategoriesRaw = bookRepository.findAllCategoriesByUser(user);

        Map<String, Long> categoryCount = allCategoriesRaw.stream()
                .flatMap(cats -> Arrays.stream(cats.split(",")))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.groupingBy(c -> c, Collectors.counting()));

        return categoryCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    public List<String> getRecentSearches(User user, int limit) {
        return searchHistoryRepository.findDistinctQueriesByUserOrderByTimestampDesc(user)
                .stream()
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<RecommendedBookDto> getRecommendationsByAuthor(String author, Set<String> ownedIsbns, int maxResults) {
        return filterOwnedBooks(googleBooksClient.getBooksByAuthor(author, maxResults), ownedIsbns);
    }

    public List<RecommendedBookDto> getRecommendationsByCategory(String category, Set<String> ownedIsbns,
            int maxResults) {
        return filterOwnedBooks(googleBooksClient.getBooksByCategory(category, maxResults), ownedIsbns);
    }

    public List<RecommendedBookDto> getRecommendationsByQuery(String query, Set<String> ownedIsbns, int maxResults) {
        return filterOwnedBooks(googleBooksClient.getBooksByQuery(query, maxResults), ownedIsbns);
    }

    private List<RecommendedBookDto> filterOwnedBooks(List<RecommendedBookDto> books, Set<String> ownedIsbns) {
        return books.stream()
                .filter(book -> book.isbn() == null || !ownedIsbns.contains(book.isbn()))
                .collect(Collectors.toList());
    }
}
