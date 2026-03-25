package com.example.readflow.books;

import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.SessionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReadingGoalProgressCalculatorTest {

    @Mock
    private ReadingSessionRepository sessionRepository;

    private ReadingGoalProgressCalculator calculator;

    // Fixed to Wednesday 2026-03-25T10:00:00Z
    // -> Start of week (Monday) = 2026-03-23T00:00:00Z
    // -> Start of month = 2026-03-01T00:00:00Z
    private static final Instant FIXED_NOW = Instant.parse("2026-03-25T10:00:00Z");
    private static final Instant EXPECTED_WEEK_START = Instant.parse("2026-03-23T00:00:00Z");
    private static final Instant EXPECTED_MONTH_START = Instant.parse("2026-03-01T00:00:00Z");

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        calculator = new ReadingGoalProgressCalculator(sessionRepository, fixedClock);
    }

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
    void calculateProgress_Weekly_ShouldQueryFromStartOfWeek() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        when(sessionRepository.sumPagesReadByBookSince(eq(book), eq(EXPECTED_WEEK_START), eq(SessionStatus.COMPLETED))).thenReturn(25);

        assertEquals(25, calculator.calculateProgress(book));
        verify(sessionRepository).sumPagesReadByBookSince(eq(book), eq(EXPECTED_WEEK_START), eq(SessionStatus.COMPLETED));
    }

    @Test
    void calculateProgress_Monthly_ShouldQueryFromStartOfMonth() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.MONTHLY);
        book.setReadingGoalPages(200);

        when(sessionRepository.sumPagesReadByBookSince(eq(book), eq(EXPECTED_MONTH_START), eq(SessionStatus.COMPLETED))).thenReturn(50);

        assertEquals(50, calculator.calculateProgress(book));
        verify(sessionRepository).sumPagesReadByBookSince(eq(book), eq(EXPECTED_MONTH_START), eq(SessionStatus.COMPLETED));
    }

    @Test
    void calculateProgress_ShouldReturnZero_WhenNoSessionsInPeriod() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        when(sessionRepository.sumPagesReadByBookSince(eq(book), eq(EXPECTED_WEEK_START), eq(SessionStatus.COMPLETED))).thenReturn(0);

        assertEquals(0, calculator.calculateProgress(book));
    }

    @Test
    void calculateProgressBatch_ShouldReturnMapWithProgress() {
        Book weeklyBook = createBook();
        weeklyBook.setId(1L);
        weeklyBook.setReadingGoalType(ReadingGoalType.WEEKLY);
        weeklyBook.setReadingGoalPages(100);

        Book monthlyBook = createBook();
        monthlyBook.setId(2L);
        monthlyBook.setReadingGoalType(ReadingGoalType.MONTHLY);
        monthlyBook.setReadingGoalPages(200);

        ReadingSessionRepository.BookPageSum weeklySum = mockBookPageSum(1L, 25);
        when(sessionRepository.sumPagesReadByBooksSince(eq(List.of(weeklyBook)), eq(EXPECTED_WEEK_START), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(weeklySum));
        ReadingSessionRepository.BookPageSum monthlySum = mockBookPageSum(2L, 50);
        when(sessionRepository.sumPagesReadByBooksSince(eq(List.of(monthlyBook)), eq(EXPECTED_MONTH_START), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(monthlySum));

        Map<Long, Integer> result = calculator.calculateProgressBatch(List.of(weeklyBook, monthlyBook));

        assertEquals(25, result.get(1L));
        assertEquals(50, result.get(2L));
    }

    @Test
    void calculateProgressBatch_ShouldReturnZero_WhenNoSessions() {
        Book book = createBook();
        book.setId(1L);
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        when(sessionRepository.sumPagesReadByBooksSince(anyList(), eq(EXPECTED_WEEK_START), eq(SessionStatus.COMPLETED)))
                .thenReturn(java.util.Collections.emptyList());

        Map<Long, Integer> result = calculator.calculateProgressBatch(List.of(book));

        assertEquals(0, result.get(1L));
    }

    @Test
    void calculateProgressBatch_ShouldSkipBooksWithoutGoals() {
        Book bookNoGoal = createBook();
        bookNoGoal.setId(1L);
        bookNoGoal.setReadingGoalType(null);

        Map<Long, Integer> result = calculator.calculateProgressBatch(List.of(bookNoGoal));

        assertTrue(result.isEmpty());
        verifyNoInteractions(sessionRepository);
    }

    private Book createBook() {
        Book book = new Book();
        book.setId(1L);
        book.setIsbn("isbn123");
        book.setTitle("Test Book");
        book.setPublishYear(2023);
        book.setPageCount(300);
        book.setCurrentPage(50);
        return book;
    }

    private ReadingSessionRepository.BookPageSum mockBookPageSum(Long bookId, Integer totalPages) {
        ReadingSessionRepository.BookPageSum mock = org.mockito.Mockito.mock(ReadingSessionRepository.BookPageSum.class);
        when(mock.getBookId()).thenReturn(bookId);
        when(mock.getTotalPages()).thenReturn(totalPages);
        return mock;
    }
}
