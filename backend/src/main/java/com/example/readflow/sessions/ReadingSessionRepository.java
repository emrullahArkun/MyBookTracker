package com.example.readflow.sessions;

import com.example.readflow.auth.User;
import com.example.readflow.books.Book;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReadingSessionRepository extends JpaRepository<ReadingSession, Long> {

    Optional<ReadingSession> findFirstByUserAndStatusInOrderByStartTimeDesc(User user,
            Collection<SessionStatus> statuses);

    List<ReadingSession> findByUserAndBook(User user, Book book);

    void deleteByUserAndBook(User user, Book book);
}
