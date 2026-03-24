package com.example.readflow.books;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BookProgressServiceTest {

    private final BookProgressService bookProgressService = new BookProgressService();

    @Test
    void updateProgress_ShouldSetCurrentPage() {
        Book book = new Book();
        book.setPageCount(200);

        Book result = bookProgressService.updateProgress(book, 50);
        assertEquals(50, result.getCurrentPage());
    }

    @Test
    void updateProgress_ShouldAutoComplete_WhenPageReachesTotal() {
        Book book = new Book();
        book.setPageCount(200);

        Book result = bookProgressService.updateProgress(book, 200);
        assertTrue(result.getCompleted());
    }

    @Test
    void updateProgress_ShouldUnComplete_WhenPageBelowTotal() {
        Book book = new Book();
        book.setPageCount(200);
        book.setCompleted(true);

        Book result = bookProgressService.updateProgress(book, 150);
        assertFalse(result.getCompleted());
    }

    @Test
    void updateProgress_ShouldNotSetCompleted_WhenPageCountIsNull() {
        Book book = new Book();
        book.setPageCount(null);

        Book result = bookProgressService.updateProgress(book, 50);
        assertEquals(50, result.getCurrentPage());
        assertNull(result.getCompleted());
    }

    @Test
    void updateProgress_ShouldThrow_WhenPageNegative() {
        Book book = new Book();
        assertThrows(IllegalArgumentException.class,
                () -> bookProgressService.updateProgress(book, -1));
    }

    @Test
    void updateProgress_ShouldThrow_WhenPageExceedsTotal() {
        Book book = new Book();
        book.setPageCount(200);
        assertThrows(IllegalArgumentException.class,
                () -> bookProgressService.updateProgress(book, 201));
    }
}
