package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import com.example.readflow.discovery.dto.DiscoveryResponse;
import com.example.readflow.discovery.dto.RecommendedBookDto;
import com.example.readflow.shared.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/discovery")
@RequiredArgsConstructor
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    private static final int DEFAULT_LIMIT = 5;
    private static final int MAX_RESULTS = 10;

    @PostMapping("/search-log")
    public ResponseEntity<Void> logSearch(@RequestParam String query, @CurrentUser User user) {
        discoveryService.logSearch(query, user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/authors")
    public ResponseEntity<DiscoveryResponse.AuthorSection> getAuthorRecommendations(@CurrentUser User user) {
        Set<String> ownedIsbns = discoveryService.getOwnedIsbns(user);
        List<String> topAuthors = discoveryService.getTopAuthors(user, 3);
        List<RecommendedBookDto> books = topAuthors.isEmpty()
                ? Collections.emptyList()
                : discoveryService.getRecommendationsByAuthor(topAuthors.get(0), ownedIsbns, MAX_RESULTS);

        return ResponseEntity.ok(new DiscoveryResponse.AuthorSection(topAuthors, books));
    }

    @GetMapping("/categories")
    public ResponseEntity<DiscoveryResponse.CategorySection> getCategoryRecommendations(@CurrentUser User user) {
        Set<String> ownedIsbns = discoveryService.getOwnedIsbns(user);
        List<String> topCategories = discoveryService.getTopCategories(user, 3);
        List<RecommendedBookDto> books = topCategories.isEmpty()
                ? Collections.emptyList()
                : discoveryService.getRecommendationsByCategory(topCategories.get(0), ownedIsbns, MAX_RESULTS);

        return ResponseEntity.ok(new DiscoveryResponse.CategorySection(topCategories, books));
    }

    @GetMapping("/recent-searches")
    public ResponseEntity<DiscoveryResponse.SearchSection> getRecentSearchRecommendations(@CurrentUser User user) {
        Set<String> ownedIsbns = discoveryService.getOwnedIsbns(user);
        List<String> recentSearches = discoveryService.getRecentSearches(user, DEFAULT_LIMIT);
        List<RecommendedBookDto> books = recentSearches.isEmpty()
                ? Collections.emptyList()
                : discoveryService.getRecommendationsByQuery(recentSearches.get(0), ownedIsbns, MAX_RESULTS);

        return ResponseEntity.ok(new DiscoveryResponse.SearchSection(recentSearches, books));
    }

    @GetMapping
    public ResponseEntity<DiscoveryResponse> getDiscoveryData(@CurrentUser User user) {
        Set<String> ownedIsbns = discoveryService.getOwnedIsbns(user);

        List<String> topAuthors = discoveryService.getTopAuthors(user, 3);
        List<RecommendedBookDto> authorBooks = topAuthors.isEmpty()
                ? Collections.emptyList()
                : discoveryService.getRecommendationsByAuthor(topAuthors.get(0), ownedIsbns, MAX_RESULTS);
        var authorSection = new DiscoveryResponse.AuthorSection(topAuthors, authorBooks);

        List<String> topCategories = discoveryService.getTopCategories(user, 3);
        List<RecommendedBookDto> categoryBooks = topCategories.isEmpty()
                ? Collections.emptyList()
                : discoveryService.getRecommendationsByCategory(topCategories.get(0), ownedIsbns, MAX_RESULTS);
        var categorySection = new DiscoveryResponse.CategorySection(topCategories, categoryBooks);

        List<String> recentSearches = discoveryService.getRecentSearches(user, 3);
        List<RecommendedBookDto> searchBooks = recentSearches.isEmpty()
                ? Collections.emptyList()
                : discoveryService.getRecommendationsByQuery(recentSearches.get(0), ownedIsbns, MAX_RESULTS);
        var searchSection = new DiscoveryResponse.SearchSection(recentSearches, searchBooks);

        return ResponseEntity.ok(new DiscoveryResponse(authorSection, categorySection, searchSection));
    }
}
