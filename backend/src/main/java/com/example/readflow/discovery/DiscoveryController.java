package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import com.example.readflow.discovery.dto.DiscoveryResponse;
import com.example.readflow.discovery.dto.SearchResultDto;
import com.example.readflow.shared.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/discovery")
@RequiredArgsConstructor
public class DiscoveryController {

    private final DiscoveryService discoveryService;

    @GetMapping("/search")
    public ResponseEntity<SearchResultDto> searchBooks(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int startIndex,
            @RequestParam(defaultValue = "36") int maxResults,
            @CurrentUser User user) {
        Set<String> ownedIsbns = discoveryService.getOwnedIsbns(user);
        SearchResultDto result = discoveryService.searchBooks(q, ownedIsbns, startIndex, maxResults);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/search-log")
    public ResponseEntity<Void> logSearch(@RequestBody java.util.Map<String, String> body, @CurrentUser User user) {
        discoveryService.logSearch(body.get("query"), user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/authors")
    public ResponseEntity<DiscoveryResponse.AuthorSection> getAuthorRecommendations(@CurrentUser User user) {
        Set<String> ownedIsbns = discoveryService.getOwnedIsbns(user);
        return ResponseEntity.ok(discoveryService.getAuthorSection(user, ownedIsbns));
    }

    @GetMapping("/categories")
    public ResponseEntity<DiscoveryResponse.CategorySection> getCategoryRecommendations(@CurrentUser User user) {
        Set<String> ownedIsbns = discoveryService.getOwnedIsbns(user);
        return ResponseEntity.ok(discoveryService.getCategorySection(user, ownedIsbns));
    }

    @GetMapping("/recent-searches")
    public ResponseEntity<DiscoveryResponse.SearchSection> getRecentSearchRecommendations(@CurrentUser User user) {
        Set<String> ownedIsbns = discoveryService.getOwnedIsbns(user);
        return ResponseEntity.ok(discoveryService.getSearchSection(user, ownedIsbns));
    }

    @GetMapping
    public ResponseEntity<DiscoveryResponse> getDiscoveryData(@CurrentUser User user) {
        return ResponseEntity.ok(discoveryService.getDiscoveryData(user));
    }
}
