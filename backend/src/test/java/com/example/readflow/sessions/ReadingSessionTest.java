package com.example.readflow.sessions;

import com.example.readflow.books.Book;
import com.example.readflow.auth.User;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class ReadingSessionTest {

    @Test
    void equals_ShouldReturnTrue_ForSameId() {
        ReadingSession a = new ReadingSession();
        a.setId(1L);
        ReadingSession b = new ReadingSession();
        b.setId(1L);

        assertEquals(a, b);
    }

    @Test
    void equals_ShouldReturnFalse_ForDifferentId() {
        ReadingSession a = new ReadingSession();
        a.setId(1L);
        ReadingSession b = new ReadingSession();
        b.setId(2L);

        assertNotEquals(a, b);
    }

    @Test
    void equals_ShouldReturnFalse_WhenIdIsNull() {
        ReadingSession a = new ReadingSession();
        ReadingSession b = new ReadingSession();

        // Both have null id — should not be equal
        assertNotEquals(a, b);
    }

    @Test
    void equals_ShouldReturnTrue_ForSameInstance() {
        ReadingSession a = new ReadingSession();
        a.setId(1L);
        assertEquals(a, a);
    }

    @Test
    void equals_ShouldReturnFalse_ForNull() {
        ReadingSession a = new ReadingSession();
        a.setId(1L);
        assertFalse(a.equals(null));
    }

    @Test
    void equals_ShouldReturnFalse_ForDifferentType() {
        ReadingSession a = new ReadingSession();
        a.setId(1L);
        assertFalse(a.equals("not a session"));
    }

    @Test
    void hashCode_ShouldBeConsistent() {
        ReadingSession a = new ReadingSession();
        a.setId(1L);
        ReadingSession b = new ReadingSession();
        b.setId(1L);

        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void equals_ShouldReturnFalse_WhenThisIdSetButOtherIdNull() {
        ReadingSession a = new ReadingSession();
        a.setId(1L);
        ReadingSession b = new ReadingSession(); // id is null

        assertNotEquals(a, b);
    }

    @Test
    void equals_ShouldReturnFalse_WhenThisIdNullButOtherIdSet() {
        ReadingSession a = new ReadingSession(); // id is null
        ReadingSession b = new ReadingSession();
        b.setId(1L);

        assertNotEquals(a, b);
    }

    @Test
    void settersAndGetters_ShouldWork() {
        ReadingSession session = new ReadingSession();
        Instant now = Instant.now();

        User user = new User();
        user.setId(1L);
        Book book = new Book();
        book.setId(2L);

        session.setId(10L);
        session.setUser(user);
        session.setBook(book);
        session.setStartTime(now);
        session.setEndTime(now);
        session.setStatus(SessionStatus.ACTIVE);
        session.setEndPage(100);
        session.setPagesRead(50);
        session.setPausedMillis(5000L);
        session.setPausedAt(now);

        assertEquals(10L, session.getId());
        assertEquals(user, session.getUser());
        assertEquals(book, session.getBook());
        assertEquals(now, session.getStartTime());
        assertEquals(now, session.getEndTime());
        assertEquals(SessionStatus.ACTIVE, session.getStatus());
        assertEquals(100, session.getEndPage());
        assertEquals(50, session.getPagesRead());
        assertEquals(5000L, session.getPausedMillis());
        assertEquals(now, session.getPausedAt());
    }
}
