package com.example.mybooktracker.books.application;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class BookSectionTest {

    @Test
    void fromValue_ShouldTrimAndNormalizeCase() {
        assertEquals(BookSection.NEXT, BookSection.fromValue(" next "));
    }

    @Test
    void fromValue_ShouldThrowWhenValueIsNull() {
        assertThrows(IllegalArgumentException.class, () -> BookSection.fromValue(null));
    }
}
