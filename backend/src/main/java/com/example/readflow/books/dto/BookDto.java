package com.example.readflow.books.dto;

import java.time.LocalDate;

public record BookDto(
                Long id,
                String isbn,
                String title,
                String authorName,
                String publishDate,
                String coverUrl,
                Integer pageCount,
                Integer currentPage,
                LocalDate startDate,
                Boolean completed,
                String readingGoalType,
                Integer readingGoalPages,
                Integer readingGoalProgress,
                String categories) {
}
