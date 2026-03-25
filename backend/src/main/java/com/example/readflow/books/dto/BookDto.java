package com.example.readflow.books.dto;

import com.example.readflow.books.ReadingGoalType;

import java.time.LocalDate;
import java.util.List;

public record BookDto(
                Long id,
                String isbn,
                String title,
                String authorName,
                Integer publishYear,
                String coverUrl,
                Integer pageCount,
                Integer currentPage,
                LocalDate startDate,
                Boolean completed,
                ReadingGoalType readingGoalType,
                Integer readingGoalPages,
                Integer readingGoalProgress,
                List<String> categories) {

        public static BookDto copyWithProgress(BookDto dto, Integer progress) {
                return new BookDto(dto.id, dto.isbn, dto.title, dto.authorName, dto.publishYear,
                                dto.coverUrl, dto.pageCount, dto.currentPage, dto.startDate,
                                dto.completed, dto.readingGoalType, dto.readingGoalPages,
                                progress, dto.categories);
        }
}
