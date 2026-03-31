package com.example.mybooktracker.sessions.domain;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.domain.Book;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static com.example.mybooktracker.support.BookFixtures.book;

class ReadingSessionTest {

    private User user;
    private Book book;
    private Instant now;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);

        book = book().id(1L).build();

        now = Instant.now();
    }

    @Test
    void startNew_ShouldUseZero_WhenCurrentPageNull() {
        book.restoreTracking(null, null, null);
        ReadingSession session = ReadingSession.startNew(user, book, now);
        assertEquals(0, session.getStartPage());
    }

    @Test
    void startNew_ShouldUseCurrentPage_WhenAvailable() {
        book.restoreTracking(50, null, null);
        ReadingSession session = ReadingSession.startNew(user, book, now);
        assertEquals(50, session.getStartPage());
    }

    @Test
    void getPausedMillisOrZero_ShouldReturnZero_WhenNull() {
        ReadingSession session = new ReadingSession();
        session.setPausedMillis(null);
        assertEquals(0L, session.getPausedMillisOrZero());
    }

    @Test
    void getPausedMillisOrZero_ShouldReturnValue_WhenNotNull() {
        ReadingSession session = new ReadingSession();
        session.setPausedMillis(5000L);
        assertEquals(5000L, session.getPausedMillisOrZero());
    }

    @Test
    void finish_ShouldNotAccumulatePause_WhenNotPaused() {
        ReadingSession session = ReadingSession.startNew(user, book, now);
        // finish it without pausing
        session.finish(now.plusSeconds(3600), 100);
        assertEquals(0L, session.getPausedMillisOrZero());
        assertEquals(SessionStatus.COMPLETED, session.getStatus());
    }

    @Test
    void finish_ShouldNotAccumulateNegativeGap() {
        ReadingSession session = ReadingSession.startNew(user, book, now);
        session.pause(now.plusSeconds(60));
        
        // finish time earlier than pause time = negative gap
        session.finish(now.plusSeconds(30), 100);
        assertEquals(0L, session.getPausedMillisOrZero());
        assertEquals(SessionStatus.COMPLETED, session.getStatus());
    }

    @Test
    void resume_ShouldNotAccumulateNegativeGap() {
        ReadingSession session = ReadingSession.startNew(user, book, now);
        session.pause(now.plusSeconds(60));

        // resume time earlier than pause time = negative gap
        session.resume(now.plusSeconds(30));
        assertEquals(0L, session.getPausedMillisOrZero());
        assertEquals(SessionStatus.ACTIVE, session.getStatus());
    }

    @Test
    void addExcludedTime_ShouldAccumulate() {
        ReadingSession session = new ReadingSession();
        session.setPausedMillis(1000L);
        session.addExcludedTime(5000L);
        assertEquals(6000L, session.getPausedMillisOrZero());
    }

    @Test
    void equals_SameReference() {
        ReadingSession session = new ReadingSession();
        assertTrue(session.equals(session));
    }

    @Test
    void equals_DifferentType() {
        ReadingSession session = new ReadingSession();
        assertFalse(session.equals(new Object()));
        assertFalse(session.equals(null));
    }

    @Test
    void equals_NullId() {
        ReadingSession session1 = new ReadingSession();
        ReadingSession session2 = new ReadingSession();
        assertFalse(session1.equals(session2)); // both ids are null
    }

    @Test
    void equals_SameId() {
        ReadingSession session1 = new ReadingSession();
        session1.setId(1L);
        ReadingSession session2 = new ReadingSession();
        session2.setId(1L);
        assertTrue(session1.equals(session2));
    }

    @Test
    void equals_DifferentId() {
        ReadingSession session1 = new ReadingSession();
        session1.setId(1L);
        ReadingSession session2 = new ReadingSession();
        session2.setId(2L);
        assertFalse(session1.equals(session2));
    }

    @Test
    void hashCode_ShouldBeConsistent() {
        ReadingSession session = new ReadingSession();
        assertEquals(ReadingSession.class.hashCode(), session.hashCode());
    }
}
