package com.example.readflow.books;

import com.example.readflow.sessions.ReadingSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReadingGoalProgressCalculatorTest {

    @Mock
    private ReadingSessionRepository sessionRepository;

    @InjectMocks
    private ReadingGoalProgressCalculator calculator;

    @Test
    void calculateProgress_ShouldReturnNull_WhenGoalTypeIsNull() {
        Book book = createBook();
        book.setReadingGoalType(null);
        book.setReadingGoalPages(100);

        assertNull(calculator.calculateProgress(book));
        verifyNoInteractions(sessionRepository);
    }

    @Test
    void calculateProgress_ShouldReturnNull_WhenGoalPagesIsNull() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(null);

        assertNull(calculator.calculateProgress(book));
        verifyNoInteractions(sessionRepository);
    }

    @Test
    void calculateProgress_Weekly_ShouldQueryRepository() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        when(sessionRepository.sumPagesReadByBookSince(eq(book), any(Instant.class))).thenReturn(25);

        assertEquals(25, calculator.calculateProgress(book));
        verify(sessionRepository).sumPagesReadByBookSince(eq(book), any(Instant.class));
    }

    @Test
    void calculateProgress_Monthly_ShouldQueryRepository() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.MONTHLY);
        book.setReadingGoalPages(200);

        when(sessionRepository.sumPagesReadByBookSince(eq(book), any(Instant.class))).thenReturn(50);

        assertEquals(50, calculator.calculateProgress(book));
        verify(sessionRepository).sumPagesReadByBookSince(eq(book), any(Instant.class));
    }

    @Test
    void calculateProgress_ShouldReturnZero_WhenNoSessionsInPeriod() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        when(sessionRepository.sumPagesReadByBookSince(eq(book), any(Instant.class))).thenReturn(0);

        assertEquals(0, calculator.calculateProgress(book));
    }

    private Book createBook() {
        Book book = new Book();
        book.setId(1L);
        book.setIsbn("isbn123");
        book.setTitle("Test Book");
        book.setPublishDate("2023");
        book.setPageCount(300);
        book.setCurrentPage(50);
        return book;
    }
}
