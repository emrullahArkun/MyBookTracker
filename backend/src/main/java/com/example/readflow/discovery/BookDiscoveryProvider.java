package com.example.readflow.discovery;

import com.example.readflow.discovery.dto.RecommendedBookDto;
import com.example.readflow.discovery.dto.SearchResultDto;

import java.util.List;

// Adapter pattern: discovery depends on this provider interface instead of a provider-specific HTTP client.
public interface BookDiscoveryProvider {

    List<RecommendedBookDto> getBooksByAuthor(String author, int maxResults);

    List<RecommendedBookDto> getBooksByCategory(String category, int maxResults);

    List<RecommendedBookDto> getBooksByQuery(String query, int maxResults);

    SearchResultDto searchBooks(String query, int offset, int limit);
}
