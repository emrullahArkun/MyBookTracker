package com.example.mybooktracker.sessions.application;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.sessions.domain.ReadingSession;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ReadingSessionQueryPort {

    Optional<Long> findActiveBookId(User user);

    List<Instant> findCompletedEndTimes(User user);

    long sumCompletedPagesByUser(User user);

    List<ReadingSession> findCompletedSessionsSince(User user, Instant since);

    long countCompletedByUser(User user);

    int sumCompletedPagesByBookSince(Book book, Instant since);

    List<BookPageProgress> sumCompletedPagesByBooksSince(List<Book> books, Instant since);

    record BookPageProgress(Long bookId, Integer totalPages) {
    }
}
