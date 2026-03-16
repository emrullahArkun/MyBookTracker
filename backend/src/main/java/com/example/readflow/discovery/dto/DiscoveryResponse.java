package com.example.readflow.discovery.dto;

import java.util.List;

public record DiscoveryResponse(
        AuthorSection byAuthor,
        CategorySection byCategory,
        SearchSection bySearch) {
    public record AuthorSection(List<String> authors, List<RecommendedBookDto> books) {
    }

    public record CategorySection(List<String> categories, List<RecommendedBookDto> books) {
    }

    public record SearchSection(List<String> queries, List<RecommendedBookDto> books) {
    }
}
