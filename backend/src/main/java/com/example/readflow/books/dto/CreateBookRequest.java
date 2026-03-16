package com.example.readflow.books.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateBookRequest(
        @NotBlank String isbn,
        @NotBlank String title,
        String authorName,
        String publishDate,
        String coverUrl,
        Integer pageCount,
        String categories) {
}
