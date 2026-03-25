package com.example.readflow.discovery.dto;

import java.util.List;

public record DiscoveryResponse(
        AuthorSection byAuthor,
        CategorySection byCategory,
        SearchSection bySearch) {
    public record AuthorSection(List<String> authors, List<RecommendedBookDto> books) {
        public AuthorSection {
            authors = authors == null ? List.of() : List.copyOf(authors);
            books = books == null ? List.of() : List.copyOf(books);
        }
    }

    public record CategorySection(List<String> categories, List<RecommendedBookDto> books) {
        public CategorySection {
            categories = categories == null ? List.of() : List.copyOf(categories);
            books = books == null ? List.of() : List.copyOf(books);
        }
    }

    public record SearchSection(List<String> queries, List<RecommendedBookDto> books) {
        public SearchSection {
            queries = queries == null ? List.of() : List.copyOf(queries);
            books = books == null ? List.of() : List.copyOf(books);
        }
    }
}
