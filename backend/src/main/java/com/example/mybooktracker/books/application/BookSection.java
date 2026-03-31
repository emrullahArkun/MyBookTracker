package com.example.mybooktracker.books.application;

public enum BookSection {
    CURRENT,
    NEXT,
    FINISHED;

    public static BookSection fromValue(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Book section is required");
        }
        return BookSection.valueOf(value.trim().toUpperCase());
    }
}
