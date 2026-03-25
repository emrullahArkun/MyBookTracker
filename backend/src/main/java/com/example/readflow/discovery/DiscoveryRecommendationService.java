package com.example.readflow.discovery;

import com.example.readflow.discovery.dto.RecommendedBookDto;
import com.example.readflow.discovery.dto.SearchResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
class DiscoveryRecommendationService {

    private final BookDiscoveryProvider discoveryProvider;

    List<RecommendedBookDto> getRecommendationsByAuthor(String author, Set<String> ownedIsbns, int maxResults) {
        return filterOwnedBooks(discoveryProvider.getBooksByAuthor(author, maxResults), ownedIsbns);
    }

    List<RecommendedBookDto> getRecommendationsByCategory(String category, Set<String> ownedIsbns, int maxResults) {
        return filterOwnedBooks(discoveryProvider.getBooksByCategory(category, maxResults), ownedIsbns);
    }

    List<RecommendedBookDto> getRecommendationsByQuery(String query, Set<String> ownedIsbns, int maxResults) {
        return filterOwnedBooks(discoveryProvider.getBooksByQuery(query, maxResults), ownedIsbns);
    }

    SearchResultDto searchBooks(String query, Set<String> ownedIsbns, int startIndex, int maxResults) {
        SearchResultDto result = discoveryProvider.searchBooks(query, startIndex, maxResults);
        List<RecommendedBookDto> filtered = filterOwnedBooks(result.items(), ownedIsbns);
        return new SearchResultDto(filtered, filtered.size());
    }

    private List<RecommendedBookDto> filterOwnedBooks(List<RecommendedBookDto> books, Set<String> ownedIsbns) {
        return books.stream()
                .filter(book -> book.isbn() == null || !ownedIsbns.contains(book.isbn()))
                .toList();
    }
}
