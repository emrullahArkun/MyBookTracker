package com.example.readflow.discovery.dto;

import java.util.List;

public record RecommendedBookDto(
        String title,
        List<String> authors,
        List<String> categories,
        String publishedDate,
        Integer pageCount,
        String isbn,
        String coverUrl) {
}
