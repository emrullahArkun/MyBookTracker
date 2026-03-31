package com.example.mybooktracker.books.application;

import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.books.domain.ReadingGoalPeriodCalculator;
import com.example.mybooktracker.books.domain.ReadingGoalType;
import com.example.mybooktracker.sessions.application.ReadingSessionQueryPort;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static com.example.mybooktracker.support.BookFixtures.book;

@ExtendWith(MockitoExtension.class)
class ReadingGoalProgressServiceTest {

    @Mock
    private ReadingSessionQueryPort readingSessionQueryPort;

    private ReadingGoalProgressService progressService;

    // Fixed to Wednesday 2026-03-25T10:00:00Z
    // -> Start of week (Monday) = 2026-03-23T00:00:00Z
    // -> Start of month = 2026-03-01T00:00:00Z
    private static final Instant FIXED_NOW = Instant.parse("2026-03-25T10:00:00Z");
    private static final Instant EXPECTED_WEEK_START = Instant.parse("2026-03-23T00:00:00Z");
    private static final Instant EXPECTED_MONTH_START = Instant.parse("2026-03-01T00:00:00Z");

    @BeforeEach
    void setUp() {
        Clock fixedClock = Clock.fixed(FIXED_NOW, ZoneOffset.UTC);
        progressService = new ReadingGoalProgressService(readingSessionQueryPort, fixedClock, new ReadingGoalPeriodCalculator());
    }

    @Test
    void calculateProgress_ShouldReturnNull_WhenGoalTypeIsNull() {
        Book book = book().id(1L).isbn("isbn123").title("Test Book").publishYear(2023).pageCount(300).currentPage(50)
                .completed(false).goal(null, 100).build();

        assertNull(progressService.calculateProgress(book));
        verifyNoInteractions(readingSessionQueryPort);
    }

    @Test
    void calculateProgress_ShouldReturnNull_WhenGoalPagesIsNull() {
        Book book = createBook();
        book.updateReadingGoal(ReadingGoalType.WEEKLY, null);

        assertNull(progressService.calculateProgress(book));
        verifyNoInteractions(readingSessionQueryPort);
    }

    @Test
    void calculateProgress_Weekly_ShouldQueryFromStartOfWeek() {
        Book book = createBook();
        book.updateReadingGoal(ReadingGoalType.WEEKLY, 100);

        when(readingSessionQueryPort.sumCompletedPagesByBookSince(eq(book), eq(EXPECTED_WEEK_START))).thenReturn(25);

        assertEquals(25, progressService.calculateProgress(book));
        verify(readingSessionQueryPort).sumCompletedPagesByBookSince(eq(book), eq(EXPECTED_WEEK_START));
    }

    @Test
    void calculateProgress_Monthly_ShouldQueryFromStartOfMonth() {
        Book book = createBook();
        book.updateReadingGoal(ReadingGoalType.MONTHLY, 200);

        when(readingSessionQueryPort.sumCompletedPagesByBookSince(eq(book), eq(EXPECTED_MONTH_START))).thenReturn(50);

        assertEquals(50, progressService.calculateProgress(book));
        verify(readingSessionQueryPort).sumCompletedPagesByBookSince(eq(book), eq(EXPECTED_MONTH_START));
    }

    @Test
    void calculateProgress_ShouldReturnZero_WhenNoSessionsInPeriod() {
        Book book = createBook();
        book.updateReadingGoal(ReadingGoalType.WEEKLY, 100);

        when(readingSessionQueryPort.sumCompletedPagesByBookSince(eq(book), eq(EXPECTED_WEEK_START))).thenReturn(0);

        assertEquals(0, progressService.calculateProgress(book));
    }

    @Test
    void calculateProgressBatch_ShouldReturnMapWithProgress() {
        Book weeklyBook = createBook();
        weeklyBook.assignIdentity(1L);
        weeklyBook.updateReadingGoal(ReadingGoalType.WEEKLY, 100);

        Book monthlyBook = createBook();
        monthlyBook.assignIdentity(2L);
        monthlyBook.updateReadingGoal(ReadingGoalType.MONTHLY, 200);

        ReadingSessionQueryPort.BookPageProgress weeklySum = new ReadingSessionQueryPort.BookPageProgress(1L, 25);
        when(readingSessionQueryPort.sumCompletedPagesByBooksSince(eq(List.of(weeklyBook)), eq(EXPECTED_WEEK_START)))
                .thenReturn(List.of(weeklySum));
        ReadingSessionQueryPort.BookPageProgress monthlySum = new ReadingSessionQueryPort.BookPageProgress(2L, 50);
        when(readingSessionQueryPort.sumCompletedPagesByBooksSince(eq(List.of(monthlyBook)), eq(EXPECTED_MONTH_START)))
                .thenReturn(List.of(monthlySum));

        Map<Long, Integer> result = progressService.calculateProgressBatch(List.of(weeklyBook, monthlyBook));

        assertEquals(25, result.get(1L));
        assertEquals(50, result.get(2L));
    }

    @Test
    void calculateProgressBatch_ShouldReturnZero_WhenNoSessions() {
        Book book = createBook();
        book.assignIdentity(1L);
        book.updateReadingGoal(ReadingGoalType.WEEKLY, 100);

        when(readingSessionQueryPort.sumCompletedPagesByBooksSince(eq(List.of(book)), eq(EXPECTED_WEEK_START)))
                .thenReturn(java.util.Collections.emptyList());

        Map<Long, Integer> result = progressService.calculateProgressBatch(List.of(book));

        assertEquals(0, result.get(1L));
    }

    @Test
    void calculateProgressBatch_ShouldSkipBooksWithoutGoals() {
        Book bookNoGoal = createBook();
        bookNoGoal.assignIdentity(1L);

        Map<Long, Integer> result = progressService.calculateProgressBatch(List.of(bookNoGoal));

        assertTrue(result.isEmpty());
        verifyNoInteractions(readingSessionQueryPort);
    }

    private Book createBook() {
        return book().id(1L).isbn("isbn123").title("Test Book").publishYear(2023).pageCount(300).currentPage(50)
                .completed(false).build();
    }
}
