package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchHistoryService {

    private static final int MAX_SEARCH_HISTORY_PER_USER = 50;
    private static final int DEDUPLICATION_MINUTES = 5;

    private final SearchHistoryRepository searchHistoryRepository;
    private final Clock clock;

    @Transactional
    public void logSearch(String query, User user) {
        if (query == null || query.trim().isEmpty()) {
            return;
        }

        String trimmedQuery = query.trim();

        LocalDateTime cutoff = LocalDateTime.now(clock).minusMinutes(DEDUPLICATION_MINUTES);
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
                .timestamp(LocalDateTime.now(clock))
                .build();
        searchHistoryRepository.save(history);
    }

    public List<String> getRecentSearches(User user, int limit) {
        return searchHistoryRepository.findDistinctQueriesByUserOrderByTimestampDesc(user)
                .stream()
                .limit(limit)
                .toList();
    }
}
