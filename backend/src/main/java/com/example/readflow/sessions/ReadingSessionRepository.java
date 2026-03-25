package com.example.readflow.sessions;

import com.example.readflow.auth.User;
import com.example.readflow.books.Book;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ReadingSessionRepository extends JpaRepository<ReadingSession, Long> {

    Optional<ReadingSession> findFirstByUserAndStatusInOrderByStartTimeDesc(User user,
            Collection<SessionStatus> statuses);

    List<ReadingSession> findByUserAndBook(User user, Book book);

    @Modifying
    @Query("DELETE FROM ReadingSession s WHERE s.user = :user AND s.book = :book")
    void deleteByUserAndBook(@Param("user") User user, @Param("book") Book book);

    @Query("SELECT DISTINCT CAST(s.endTime AS LocalDate) FROM ReadingSession s " +
           "WHERE s.user = :user AND s.status = :status AND s.endTime IS NOT NULL " +
           "AND CAST(s.endTime AS LocalDate) >= :since " +
           "ORDER BY CAST(s.endTime AS LocalDate) DESC")
    List<LocalDate> findDistinctReadingDays(@Param("user") User user, @Param("since") LocalDate since,
            @Param("status") SessionStatus status);

    @Query("SELECT DISTINCT CAST(s.endTime AS LocalDate) FROM ReadingSession s " +
           "WHERE s.user = :user AND s.status = :status AND s.endTime IS NOT NULL " +
           "ORDER BY CAST(s.endTime AS LocalDate) DESC")
    List<LocalDate> findAllDistinctReadingDays(@Param("user") User user,
            @Param("status") SessionStatus status);

    @Query("SELECT COALESCE(SUM(s.pagesRead), 0) FROM ReadingSession s " +
           "WHERE s.user = :user AND s.status = :status")
    long sumPagesReadByUser(@Param("user") User user, @Param("status") SessionStatus status);

    @Query("SELECT s FROM ReadingSession s " +
           "WHERE s.user = :user AND s.status = :status AND s.endTime IS NOT NULL " +
           "AND CAST(s.endTime AS LocalDate) >= :since")
    List<ReadingSession> findCompletedSessionsSince(@Param("user") User user, @Param("since") LocalDate since,
            @Param("status") SessionStatus status);

    @Query("SELECT COUNT(s) FROM ReadingSession s " +
           "WHERE s.user = :user AND s.status = :status")
    long countCompletedByUser(@Param("user") User user, @Param("status") SessionStatus status);

    @Query("SELECT COALESCE(SUM(s.pagesRead), 0) FROM ReadingSession s " +
           "WHERE s.book = :book AND s.status = :status AND s.endTime > :since")
    int sumPagesReadByBookSince(@Param("book") Book book, @Param("since") Instant since,
            @Param("status") SessionStatus status);

    interface BookPageSum {
        Long getBookId();
        Integer getTotalPages();
    }

    @Query("SELECT s.book.id AS bookId, COALESCE(SUM(s.pagesRead), 0) AS totalPages FROM ReadingSession s " +
           "WHERE s.book IN :books AND s.status = :status AND s.endTime > :since " +
           "GROUP BY s.book.id")
    List<BookPageSum> sumPagesReadByBooksSince(@Param("books") List<Book> books, @Param("since") Instant since,
            @Param("status") SessionStatus status);
}
