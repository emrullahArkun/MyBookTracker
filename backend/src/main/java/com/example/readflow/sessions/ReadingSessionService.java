package com.example.readflow.sessions;

import com.example.readflow.auth.User;
import com.example.readflow.books.Book;
import com.example.readflow.books.BookRepository;
import com.example.readflow.shared.exception.IllegalSessionStateException;
import com.example.readflow.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReadingSessionService {

    private final ReadingSessionRepository sessionRepository;
    private final BookRepository bookRepository;
    private final Clock clock;

    @Transactional
    public ReadingSession startSession(User user, Long bookId) {
        Optional<ReadingSession> existingOpt = sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.ACTIVE, SessionStatus.PAUSED));

        if (existingOpt.isPresent()) {
            ReadingSession existing = existingOpt.get();
            if (existing.getBook().getId().equals(bookId)) {
                if (existing.getStatus() == SessionStatus.PAUSED) {
                    existing.resume(Instant.now(clock));
                }
                return existing;
            }
        }

        Book book = bookRepository.findByIdAndUser(bookId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found or access denied"));

        existingOpt.ifPresent(existing -> existing.finish(Instant.now(clock), null));

        return sessionRepository.save(ReadingSession.startNew(user, book, Instant.now(clock)));
    }

    @Transactional
    public ReadingSession stopSession(User user, Instant endTime, Integer endPage) {
        ReadingSession session = sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.ACTIVE, SessionStatus.PAUSED))
                .orElseThrow(() -> new ResourceNotFoundException("No active reading session found"));

        Instant safeEndTime = endTime != null ? endTime : Instant.now(clock);
        session.finish(safeEndTime, endPage);

        if (endPage != null) {
            session.getBook().updateProgress(endPage);
        }

        return session;
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

        session.pause(Instant.now(clock));
        return session;
    }

    @Transactional
    public ReadingSession resumeSession(User user) {
        ReadingSession session = sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.PAUSED))
                .orElseThrow(() -> new IllegalSessionStateException("No paused session found to resume"));

        session.resume(Instant.now(clock));
        return session;
    }

    @Transactional
    public ReadingSession excludeTime(User user, Long millis) {
        if (millis == null || millis <= 0) {
            throw new IllegalArgumentException("Invalid millis");
        }
        ReadingSession session = sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(user,
                List.of(SessionStatus.ACTIVE))
                .orElseThrow(() -> new IllegalSessionStateException("No active session found"));

        session.addExcludedTime(millis);
        return session;
    }

    public List<ReadingSession> getSessionsByBook(User user, Long bookId) {
        Book book = bookRepository.findByIdAndUser(bookId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));
        return sessionRepository.findByUserAndBook(user, book);
    }

    @Transactional
    public void deleteSessionsByBook(User user, Book book) {
        sessionRepository.deleteByUserAndBook(user, book);
    }
}
