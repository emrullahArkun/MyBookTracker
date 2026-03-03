package com.example.minilibrary.books;

import com.example.minilibrary.books.BookRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookProgressServiceTest {

    @Mock
    private BookRepository bookRepository;
    @InjectMocks
    private BookProgressService bookProgressService;

    @Test
    void updateProgress_ShouldSetCurrentPage() {
        Book book = new Book();
        book.setPageCount(200);
        when(bookRepository.save(any(Book.class))).thenAnswer(i -> i.getArgument(0));

        Book result = bookProgressService.updateProgress(book, 50);
        assertEquals(50, result.getCurrentPage());
    }

    @Test
    void updateProgress_ShouldAutoComplete_WhenPageReachesTotal() {
        Book book = new Book();
        book.setPageCount(200);
        when(bookRepository.save(any(Book.class))).thenAnswer(i -> i.getArgument(0));

        Book result = bookProgressService.updateProgress(book, 200);
        assertTrue(result.getCompleted());
    }

    @Test
    void updateProgress_ShouldUnComplete_WhenPageBelowTotal() {
        Book book = new Book();
        book.setPageCount(200);
        book.setCompleted(true);
        when(bookRepository.save(any(Book.class))).thenAnswer(i -> i.getArgument(0));

        Book result = bookProgressService.updateProgress(book, 150);
        assertFalse(result.getCompleted());
    }

    @Test
    void updateProgress_ShouldNotSetCompleted_WhenPageCountIsNull() {
        Book book = new Book();
        book.setPageCount(null);
        when(bookRepository.save(any(Book.class))).thenAnswer(i -> i.getArgument(0));

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
