package com.example.mybooktracker.sessions.api;

import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.sessions.api.dto.ReadingSessionDto;
import com.example.mybooktracker.sessions.domain.ReadingSession;
import com.example.mybooktracker.sessions.domain.SessionStatus;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static com.example.mybooktracker.support.BookFixtures.book;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class ReadingSessionMapperTest {

    private final ReadingSessionMapper mapper = new ReadingSessionMapper();

    @Test
    void toDto_ShouldReturnNull_WhenSessionIsNull() {
        assertNull(mapper.toDto(null));
    }

    @Test
    void toDto_ShouldHandleMissingBook() {
        ReadingSession session = new ReadingSession();
        session.setId(7L);
        session.setStartTime(Instant.parse("2026-03-25T10:00:00Z"));
        session.setStatus(SessionStatus.ACTIVE);

        ReadingSessionDto dto = mapper.toDto(session);

        assertEquals(7L, dto.id());
        assertNull(dto.bookId());
    }

    @Test
    void toDto_ShouldMapBookId_WhenBookExists() {
        Book book = book().id(11L).build();
        ReadingSession session = new ReadingSession();
        session.setId(8L);
        session.attachToBook(book);
        session.setStartTime(Instant.parse("2026-03-25T10:00:00Z"));
        session.setEndTime(Instant.parse("2026-03-25T10:30:00Z"));
        session.setStatus(SessionStatus.COMPLETED);
        session.setStartPage(5);
        session.setEndPage(20);
        session.setPagesRead(15);
        session.setPausedMillis(1000L);
        session.setPausedAt(Instant.parse("2026-03-25T10:10:00Z"));

        ReadingSessionDto dto = mapper.toDto(session);

        assertEquals(11L, dto.bookId());
        assertEquals(SessionStatus.COMPLETED, dto.status());
        assertEquals(15, dto.pagesRead());
    }
}
