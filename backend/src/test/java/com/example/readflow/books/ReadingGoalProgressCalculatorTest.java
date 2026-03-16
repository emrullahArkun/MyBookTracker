package com.example.readflow.books;

import com.example.readflow.sessions.ReadingSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ReadingGoalProgressCalculatorTest {

    private ReadingGoalProgressCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new ReadingGoalProgressCalculator();
    }

    @Test
    void calculateProgress_ShouldReturnNull_WhenGoalTypeIsNull() {
        Book book = createBook();
        book.setReadingGoalType(null);
        book.setReadingGoalPages(100);

        assertNull(calculator.calculateProgress(book));
    }

    @Test
    void calculateProgress_ShouldReturnNull_WhenGoalPagesIsNull() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(null);

        assertNull(calculator.calculateProgress(book));
    }

    @Test
    void calculateProgress_ShouldReturnZero_WhenSessionsAreNull() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);
        book.setReadingSessions(null);

        assertEquals(0, calculator.calculateProgress(book));
    }

    @Test
    void calculateProgress_ShouldReturnZero_WhenNoSessionsInPeriod() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        ReadingSession session = new ReadingSession();
        session.setEndTime(Instant.parse("2020-01-01T00:00:00Z"));
        session.setPagesRead(50);
        book.setReadingSessions(List.of(session));

        assertEquals(0, calculator.calculateProgress(book));
    }

    @Test
    void calculateProgress_Weekly_ShouldSumPagesRead() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        ReadingSession session = new ReadingSession();
        session.setEndTime(Instant.now());
        session.setPagesRead(25);

        book.setReadingSessions(List.of(session));

        assertEquals(25, calculator.calculateProgress(book));
    }

    @Test
    void calculateProgress_Monthly_ShouldSumPagesRead() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.MONTHLY);
        book.setReadingGoalPages(200);

        ReadingSession s1 = new ReadingSession();
        s1.setEndTime(Instant.now());
        s1.setPagesRead(30);

        ReadingSession s2 = new ReadingSession();
        s2.setEndTime(Instant.now());
        s2.setPagesRead(20);

        book.setReadingSessions(List.of(s1, s2));

        assertEquals(50, calculator.calculateProgress(book));
    }

    @Test
    void calculateProgress_ShouldFilterOutSessionsWithNullEndTime() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        ReadingSession activeSession = new ReadingSession();
        activeSession.setEndTime(null);
        activeSession.setPagesRead(99);

        ReadingSession completedSession = new ReadingSession();
        completedSession.setEndTime(Instant.now());
        completedSession.setPagesRead(10);

        book.setReadingSessions(List.of(activeSession, completedSession));

        assertEquals(10, calculator.calculateProgress(book));
    }

    @Test
    void calculateProgress_ShouldReturnZero_WhenPagesReadIsNullAndEndPageExists() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        ReadingSession session = new ReadingSession();
        session.setEndTime(Instant.now());
        session.setPagesRead(null);
        session.setEndPage(50);

        book.setReadingSessions(List.of(session));

        assertEquals(0, calculator.calculateProgress(book));
    }

    @Test
    void calculateProgress_ShouldReturnZero_WhenPagesReadAndEndPageAreNull() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        ReadingSession session = new ReadingSession();
        session.setEndTime(Instant.now());
        session.setPagesRead(null);
        session.setEndPage(null);

        book.setReadingSessions(List.of(session));

        assertEquals(0, calculator.calculateProgress(book));
    }

    @Test
    void calculateProgress_ShouldReturnZero_WhenEndPageIsZero() {
        Book book = createBook();
        book.setReadingGoalType(ReadingGoalType.WEEKLY);
        book.setReadingGoalPages(100);

        ReadingSession session = new ReadingSession();
        session.setEndTime(Instant.now());
        session.setPagesRead(null);
        session.setEndPage(0);

        book.setReadingSessions(List.of(session));

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
