package com.example.mybooktracker.books.api.dto;

import java.util.List;

public record BookFocusResponse(
        BookDto currentBook,
        List<BookDto> queuedBooks,
        long activeBooksCount,
        long completedBooksCount) {
}
