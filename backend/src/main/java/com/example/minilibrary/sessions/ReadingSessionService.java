package com.example.minilibrary.sessions;

import com.example.minilibrary.auth.User;
import com.example.minilibrary.books.Book;
import com.example.minilibrary.books.BookProgressService;
import com.example.minilibrary.books.BookRepository;
import com.example.minilibrary.shared.exception.IllegalSessionStateException;
import com.example.minilibrary.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ReadingSessionService {

    private final ReadingSessionRepository sessionRepository;
    private final BookRepository bookRepository;
    private final BookProgressService bookProgressService;

    @Transactional
    public ReadingSession startSession(User user, Long bookId) {
        Optional<ReadingSession> existingOpt = sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.ACTIVE, SessionStatus.PAUSED));

        if (existingOpt.isPresent()) {
            ReadingSession existing = existingOpt.get();
            if (existing.getBook().getId().equals(bookId)) {
                if (existing.getStatus() == SessionStatus.PAUSED) {
                    return resumeSession(user);
                }
                return existing;
            }
            stopSession(user, Instant.now(), null);
        }

        Book book = bookRepository.findByIdAndUserId(bookId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found or access denied"));

        ReadingSession session = new ReadingSession();
        session.setUser(user);
        session.setBook(book);
        session.setStartTime(Instant.now());
        session.setStatus(SessionStatus.ACTIVE);

        return sessionRepository.save(session);
    }

    @Transactional
    public ReadingSession stopSession(User user, Instant endTime, Integer endPage) {
        ReadingSession session = sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.ACTIVE, SessionStatus.PAUSED))
                .orElseThrow(() -> new ResourceNotFoundException("No active reading session found"));

        Instant safeEndTime = endTime != null ? endTime : Instant.now();

        accumulatePausedTime(session, safeEndTime);

        session.setPausedAt(null);
        session.setEndTime(safeEndTime);
        session.setEndPage(endPage);
        session.setStatus(SessionStatus.COMPLETED);

        if (endPage != null) {
            Book book = session.getBook();

            int startPage = book.getCurrentPage() != null ? book.getCurrentPage() : 0;
            int pagesRead = endPage - startPage;
            if (pagesRead < 0)
                pagesRead = 0;

            session.setPagesRead(pagesRead);

            bookProgressService.updateProgress(book, endPage);
        }

        return sessionRepository.save(session);
    }

    public Optional<ReadingSession> getActiveSession(User user) {
        return sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.ACTIVE, SessionStatus.PAUSED));
    }

    @Transactional
    public ReadingSession pauseSession(User user) {
        ReadingSession session = sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.ACTIVE))
                .orElseThrow(() -> new IllegalSessionStateException("No active session found to pause"));

        session.setStatus(SessionStatus.PAUSED);
        session.setPausedAt(Instant.now());
        return sessionRepository.save(session);
    }

    @Transactional
    public ReadingSession resumeSession(User user) {
        ReadingSession session = sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.PAUSED))
                .orElseThrow(() -> new IllegalSessionStateException("No paused session found to resume"));

        Instant now = Instant.now();
        accumulatePausedTime(session, now);
        session.setStatus(SessionStatus.ACTIVE);
        session.setPausedAt(null);
        return sessionRepository.save(session);
    }

    @Transactional
    public ReadingSession excludeTime(User user, Long millis) {
        if (millis == null || millis < 0) {
            throw new IllegalArgumentException("Invalid millis");
        }
        ReadingSession session = sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.ACTIVE))
                .orElseThrow(() -> new IllegalSessionStateException("No active session found"));

        session.setPausedMillis(session.getPausedMillisOrZero() + millis);
        return sessionRepository.save(session);
    }

    public List<ReadingSession> getSessionsByBook(User user, Long bookId) {
        Book book = bookRepository.findByIdAndUserId(bookId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        return sessionRepository.findByUserAndBook(user, book);
    }

    @Transactional
    public void deleteSessionsByBook(User user, Book book) {
        sessionRepository.deleteByUserAndBook(user, book);
    }

    private void accumulatePausedTime(ReadingSession session, Instant endTime) {
        if (session.getStatus() == SessionStatus.PAUSED && session.getPausedAt() != null) {
            long gap = Duration.between(session.getPausedAt(), endTime).toMillis();
            if (gap > 0) {
                session.setPausedMillis(session.getPausedMillisOrZero() + gap);
            }
        }
    }
}
