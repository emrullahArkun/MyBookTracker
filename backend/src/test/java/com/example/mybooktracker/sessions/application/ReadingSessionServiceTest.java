package com.example.mybooktracker.sessions.application;

import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.application.BookQueryPort;
import com.example.mybooktracker.shared.exception.IllegalSessionStateException;
import com.example.mybooktracker.shared.exception.ResourceNotFoundException;
import com.example.mybooktracker.sessions.domain.ReadingSession;
import com.example.mybooktracker.sessions.domain.SessionStatus;
import com.example.mybooktracker.sessions.infra.persistence.ReadingSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static com.example.mybooktracker.support.BookFixtures.book;

@ExtendWith(MockitoExtension.class)
class ReadingSessionServiceTest {

    @Mock
    private ReadingSessionRepository sessionRepository;
    @Mock
    private BookQueryPort bookQueryPort;
    @Spy
    private Clock clock = Clock.systemUTC();
    @InjectMocks
    private ReadingSessionService sessionService;

    private User user;
    private Book book;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        book = book().id(10L).currentPage(0).pageCount(200).build();
    }

    // --- startSession ---

    @Test
    void startSession_ShouldCreateNewSession() {
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.empty());
        when(bookQueryPort.findByIdAndUser(10L, user)).thenReturn(Optional.of(book));
        when(sessionRepository.save(any(ReadingSession.class))).thenAnswer(i -> i.getArgument(0));

        ReadingSession result = sessionService.startSession(user, 10L);
        assertEquals(SessionStatus.ACTIVE, result.getStatus());
        assertEquals(book, result.getBook());
    }

    @Test
    void startSession_ShouldReturnExisting_WhenAlreadyReadingSameBook() {
        ReadingSession existing = new ReadingSession();
        existing.attachToBook(book);
        existing.setStatus(SessionStatus.ACTIVE);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(existing));

        ReadingSession result = sessionService.startSession(user, 10L);
        assertEquals(existing, result);
    }

    @Test
    void startSession_ShouldResumePausedSession_WhenSameBook() {
        ReadingSession paused = new ReadingSession();
        paused.attachToBook(book);
        paused.setStatus(SessionStatus.PAUSED);
        paused.setPausedAt(Instant.now().minusSeconds(60));

        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(paused));

        ReadingSession result = sessionService.startSession(user, 10L);
        assertEquals(SessionStatus.ACTIVE, result.getStatus());
        assertTrue(result.getPausedMillis() > 0);
    }

    @Test
    void startSession_ShouldAutoStopPrevious_WhenReadingDifferentBook() {
        Book otherBook = book().id(20L).build();

        ReadingSession existing = new ReadingSession();
        existing.attachToBook(otherBook);
        existing.setStatus(SessionStatus.ACTIVE);

        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(existing));
        when(bookQueryPort.findByIdAndUser(10L, user)).thenReturn(Optional.of(book));
        when(sessionRepository.save(any(ReadingSession.class))).thenAnswer(i -> i.getArgument(0));

        ReadingSession result = sessionService.startSession(user, 10L);
        assertEquals(book, result.getBook());
        assertEquals(SessionStatus.COMPLETED, existing.getStatus());
    }

    @Test
    void startSession_ShouldThrow_WhenBookNotFound() {
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.empty());
        when(bookQueryPort.findByIdAndUser(10L, user)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> sessionService.startSession(user, 10L));
    }

    @Test
    void startSession_ShouldKeepExistingSessionActive_WhenNewBookNotFound() {
        Book otherBook = book().id(20L).build();

        ReadingSession existing = new ReadingSession();
        existing.attachToBook(otherBook);
        existing.setStatus(SessionStatus.ACTIVE);

        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(existing));
        when(bookQueryPort.findByIdAndUser(10L, user)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> sessionService.startSession(user, 10L));
        assertEquals(SessionStatus.ACTIVE, existing.getStatus());
        verify(sessionRepository, never()).save(any(ReadingSession.class));
    }

    // --- stopSession ---

    @Test
    void stopSession_ShouldCompleteSession() {
        ReadingSession session = new ReadingSession();
        session.attachToBook(book);
        session.setStatus(SessionStatus.ACTIVE);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(session));

        ReadingSession result = sessionService.stopSession(user, Instant.now(), null);
        assertEquals(SessionStatus.COMPLETED, result.getStatus());
    }

    @Test
    void stopSession_ShouldUpdateBookProgress_WhenEndPageProvided() {
        ReadingSession session = new ReadingSession();
        session.attachToBook(book);
        session.setStatus(SessionStatus.ACTIVE);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(session));

        ReadingSession result = sessionService.stopSession(user, Instant.now(), 50);
        assertEquals(50, result.getPagesRead());
        assertEquals(50, book.getCurrentPage());
    }

    @Test
    void stopSession_ShouldAccumulatePausedTime_WhenPaused() {
        ReadingSession session = new ReadingSession();
        session.attachToBook(book);
        session.setStatus(SessionStatus.PAUSED);
        session.setPausedAt(Instant.now().minusSeconds(10));
        session.setPausedMillis(5000L);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(session));

        ReadingSession result = sessionService.stopSession(user, Instant.now(), null);
        assertTrue(result.getPausedMillis() > 5000L);
    }

    @Test
    void stopSession_ShouldUseNow_WhenEndTimeNull() {
        ReadingSession session = new ReadingSession();
        session.attachToBook(book);
        session.setStatus(SessionStatus.ACTIVE);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(session));

        ReadingSession result = sessionService.stopSession(user, null, null);
        assertNotNull(result.getEndTime());
    }

    @Test
    void stopSession_ShouldThrow_WhenNoActiveSession() {
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> sessionService.stopSession(user, Instant.now(), null));
    }

    @Test
    void stopSession_ShouldHandleNegativePagesRead() {
        book.restoreTracking(100, null, null);
        ReadingSession session = new ReadingSession();
        session.attachToBook(book);
        session.setStartPage(100); // Session recorded start page at 100
        session.setStatus(SessionStatus.ACTIVE);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(session));

        ReadingSession result = sessionService.stopSession(user, Instant.now(), 50);
        assertEquals(0, result.getPagesRead()); // Clamped to 0
    }

    @Test
    void stopSession_ShouldNotAccumulatePause_WhenPausedButPausedAtNull() {
        ReadingSession session = new ReadingSession();
        session.attachToBook(book);
        session.setStatus(SessionStatus.PAUSED);
        session.setPausedAt(null); // PAUSED but pausedAt is null
        session.setPausedMillis(5000L);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(session));

        ReadingSession result = sessionService.stopSession(user, Instant.now(), null);
        assertEquals(5000L, result.getPausedMillis()); // Unchanged
    }

    @Test
    void stopSession_ShouldAccumulatePause_WhenPausedMillisNull() {
        ReadingSession session = new ReadingSession();
        session.attachToBook(book);
        session.setStatus(SessionStatus.PAUSED);
        session.setPausedAt(Instant.now().minusSeconds(10));
        session.setPausedMillis(null); // null pausedMillis
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(session));

        ReadingSession result = sessionService.stopSession(user, Instant.now(), null);
        assertNotNull(result.getPausedMillis());
        assertTrue(result.getPausedMillis() > 0);
    }

    @Test
    void stopSession_ShouldHandleNullCurrentPage_WhenCalculatingPagesRead() {
        book.restoreTracking(null, null, null); // null currentPage defaults to 0
        ReadingSession session = new ReadingSession();
        session.attachToBook(book);
        session.setStatus(SessionStatus.ACTIVE);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user), anyList()))
                .thenReturn(Optional.of(session));

        ReadingSession result = sessionService.stopSession(user, Instant.now(), 30);
        assertEquals(30, result.getPagesRead()); // 30 - 0
    }

    // --- pauseSession ---

    @Test
    void pauseSession_ShouldSetPaused() {
        ReadingSession session = new ReadingSession();
        session.setStatus(SessionStatus.ACTIVE);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user),
                eq(List.of(SessionStatus.ACTIVE)))).thenReturn(Optional.of(session));

        ReadingSession result = sessionService.pauseSession(user);
        assertEquals(SessionStatus.PAUSED, result.getStatus());
        assertNotNull(result.getPausedAt());
    }

    @Test
    void pauseSession_ShouldThrow_WhenNoActiveSession() {
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user),
                eq(List.of(SessionStatus.ACTIVE)))).thenReturn(Optional.empty());

        assertThrows(IllegalSessionStateException.class, () -> sessionService.pauseSession(user));
    }

    // --- resumeSession ---

    @Test
    void resumeSession_ShouldSetActive() {
        ReadingSession session = new ReadingSession();
        session.setStatus(SessionStatus.PAUSED);
        session.setPausedAt(Instant.now().minusSeconds(10));
        session.setPausedMillis(0L);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user),
                eq(List.of(SessionStatus.PAUSED)))).thenReturn(Optional.of(session));

        ReadingSession result = sessionService.resumeSession(user);
        assertEquals(SessionStatus.ACTIVE, result.getStatus());
        assertNull(result.getPausedAt());
        assertTrue(result.getPausedMillis() > 0);
    }

    @Test
    void resumeSession_ShouldHandleNullPausedAt() {
        ReadingSession session = new ReadingSession();
        session.setStatus(SessionStatus.PAUSED);
        session.setPausedAt(null); // Edge case
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user),
                eq(List.of(SessionStatus.PAUSED)))).thenReturn(Optional.of(session));

        ReadingSession result = sessionService.resumeSession(user);
        assertEquals(SessionStatus.ACTIVE, result.getStatus());
    }

    @Test
    void resumeSession_ShouldHandleNullPausedMillis() {
        ReadingSession session = new ReadingSession();
        session.setStatus(SessionStatus.PAUSED);
        session.setPausedAt(Instant.now().minusSeconds(5));
        session.setPausedMillis(null); // null pausedMillis
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user),
                eq(List.of(SessionStatus.PAUSED)))).thenReturn(Optional.of(session));

        ReadingSession result = sessionService.resumeSession(user);
        assertNotNull(result.getPausedMillis());
        assertTrue(result.getPausedMillis() > 0);
    }

    @Test
    void resumeSession_ShouldThrow_WhenNoPausedSession() {
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user),
                eq(List.of(SessionStatus.PAUSED)))).thenReturn(Optional.empty());

        assertThrows(IllegalSessionStateException.class, () -> sessionService.resumeSession(user));
    }

    // --- excludeTime ---

    @Test
    void excludeTime_ShouldAddMillis() {
        ReadingSession session = new ReadingSession();
        session.setPausedMillis(1000L);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user),
                eq(List.of(SessionStatus.ACTIVE)))).thenReturn(Optional.of(session));

        ReadingSession result = sessionService.excludeTime(user, 500L);
        assertEquals(1500L, result.getPausedMillis());
    }

    @Test
    void excludeTime_ShouldHandleNullPausedMillis() {
        ReadingSession session = new ReadingSession();
        session.setPausedMillis(null);
        when(sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(eq(user),
                eq(List.of(SessionStatus.ACTIVE)))).thenReturn(Optional.of(session));

        ReadingSession result = sessionService.excludeTime(user, 500L);
        assertEquals(500L, result.getPausedMillis());
    }

    @Test
    void excludeTime_ShouldThrow_WhenMillisNull() {
        assertThrows(IllegalArgumentException.class,
                () -> sessionService.excludeTime(user, null));
    }

    @Test
    void excludeTime_ShouldThrow_WhenMillisZero() {
        assertThrows(IllegalArgumentException.class,
                () -> sessionService.excludeTime(user, 0L));
    }

    @Test
    void excludeTime_ShouldThrow_WhenMillisNegative() {
        assertThrows(IllegalArgumentException.class,
                () -> sessionService.excludeTime(user, -1L));
    }

    // --- getSessionsByBook ---

    @Test
    void getSessionsByBook_ShouldReturnSessions() {
        when(bookQueryPort.findByIdAndUser(10L, user)).thenReturn(Optional.of(book));
        when(sessionRepository.findByUserAndBook(user, book)).thenReturn(List.of(new ReadingSession()));

        List<ReadingSession> result = sessionService.getSessionsByBook(user, 10L);
        assertEquals(1, result.size());
    }

    @Test
    void getSessionsByBook_ShouldThrow_WhenBookNotFound() {
        when(bookQueryPort.findByIdAndUser(10L, user)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> sessionService.getSessionsByBook(user, 10L));
    }

    // --- deleteSessionsByBook ---

    @Test
    void deleteSessionsByBook_ShouldDelegate() {
        sessionService.deleteSessionsByBook(user, book);
        verify(sessionRepository).deleteByUserAndBook(user, book);
    }

}
