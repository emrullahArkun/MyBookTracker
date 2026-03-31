package com.example.mybooktracker.sessions.infra.persistence;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.sessions.application.ReadingSessionQueryPort;
import com.example.mybooktracker.sessions.domain.ReadingSession;
import com.example.mybooktracker.sessions.domain.SessionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class ReadingSessionQueryAdapter implements ReadingSessionQueryPort {

    private final ReadingSessionRepository readingSessionRepository;

    @Override
    public Optional<Long> findActiveBookId(User user) {
        return readingSessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(
                        user,
                        List.of(SessionStatus.ACTIVE, SessionStatus.PAUSED))
                .map(session -> session.getBook().getId());
    }

    @Override
    public List<Instant> findCompletedEndTimes(User user) {
        return readingSessionRepository.findAllCompletedEndTimes(user, SessionStatus.COMPLETED);
    }

    @Override
    public long sumCompletedPagesByUser(User user) {
        return readingSessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED);
    }

    @Override
    public List<ReadingSession> findCompletedSessionsSince(User user, Instant since) {
        return readingSessionRepository.findCompletedSessionsSince(user, since, SessionStatus.COMPLETED);
    }

    @Override
    public long countCompletedByUser(User user) {
        return readingSessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED);
    }

    @Override
    public int sumCompletedPagesByBookSince(Book book, Instant since) {
        return readingSessionRepository.sumPagesReadByBookSince(book, since, SessionStatus.COMPLETED);
    }

    @Override
    public List<BookPageProgress> sumCompletedPagesByBooksSince(List<Book> books, Instant since) {
        return readingSessionRepository.sumPagesReadByBooksSince(books, since, SessionStatus.COMPLETED).stream()
                .map(row -> new BookPageProgress(row.getBookId(), row.getTotalPages()))
                .toList();
    }
}
