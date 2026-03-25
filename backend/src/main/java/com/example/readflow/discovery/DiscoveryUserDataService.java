package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class DiscoveryUserDataService {

    private final SearchHistoryService searchHistoryService;
    private final BookRepository bookRepository;

    @Cacheable(value = "ownedIsbns", key = "#user.id")
    Set<String> getOwnedIsbns(User user) {
        return new HashSet<>(bookRepository.findAllIsbnsByUser(user));
    }

    List<String> getTopAuthors(User user, int limit) {
        return bookRepository.findTopAuthorsByUser(user, PageRequest.of(0, limit));
    }

    List<String> getTopCategories(User user, int limit) {
        return bookRepository.findTopCategoriesByUser(user, PageRequest.of(0, limit));
    }

    List<String> getRecentSearches(User user, int limit) {
        return searchHistoryService.getRecentSearches(user, limit);
    }

    DiscoverySnapshot getSnapshot(User user, int recommendationLimit, int searchLimit) {
        return new DiscoverySnapshot(
                getOwnedIsbns(user),
                getTopAuthors(user, recommendationLimit),
                getTopCategories(user, recommendationLimit),
                getRecentSearches(user, searchLimit));
    }
}
