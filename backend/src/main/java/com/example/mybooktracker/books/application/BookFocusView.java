package com.example.mybooktracker.books.application;

import com.example.mybooktracker.books.domain.Book;

import java.util.List;

public record BookFocusView(
        Book currentBook,
        List<Book> queuedBooks,
        long activeBooksCount,
        long completedBooksCount) {
}
