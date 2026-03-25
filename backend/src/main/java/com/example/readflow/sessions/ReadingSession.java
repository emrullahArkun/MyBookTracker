package com.example.readflow.sessions;

import com.example.readflow.auth.User;
import com.example.readflow.books.Book;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Duration;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "reading_session", indexes = {
        @Index(name = "idx_session_user", columnList = "user_id"),
        @Index(name = "idx_session_book", columnList = "book_id"),
        @Index(name = "idx_session_user_status", columnList = "user_id, status")
})
public class ReadingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;

    @Column(nullable = false)
    private Instant startTime;

    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    private Integer startPage;

    private Integer endPage;

    private Integer pagesRead;

    @Column(name = "paused_millis", columnDefinition = "bigint default 0")
    private Long pausedMillis = 0L;

    @Column(name = "paused_at")
    private Instant pausedAt;

    public static ReadingSession startNew(User user, Book book, Instant now) {
        ReadingSession session = new ReadingSession();
        session.user = user;
        session.book = book;
        session.startTime = now;
        session.startPage = book.getCurrentPage() != null ? book.getCurrentPage() : 0;
        session.status = SessionStatus.ACTIVE;
        return session;
    }

    public long getPausedMillisOrZero() {
        return pausedMillis != null ? pausedMillis : 0L;
    }

    public void pause(Instant now) {
        if (this.status != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Only active sessions can be paused.");
        }
        this.status = SessionStatus.PAUSED;
        this.pausedAt = now;
    }

    public void resume(Instant now) {
        if (this.status != SessionStatus.PAUSED) {
            throw new IllegalStateException("Only paused sessions can be resumed.");
        }
        if (this.pausedAt != null) {
            long gap = Duration.between(this.pausedAt, now).toMillis();
            if (gap > 0) {
                this.pausedMillis = getPausedMillisOrZero() + gap;
            }
        }
        this.status = SessionStatus.ACTIVE;
        this.pausedAt = null;
    }

    public void finish(Instant now, Integer endPage) {
        if (this.status == SessionStatus.PAUSED && this.pausedAt != null) {
            long gap = Duration.between(this.pausedAt, now).toMillis();
            if (gap > 0) {
                this.pausedMillis = getPausedMillisOrZero() + gap;
            }
        }
        this.pausedAt = null;
        this.endTime = now;
        this.endPage = endPage;
        this.status = SessionStatus.COMPLETED;

        if (endPage != null) {
            int sessionStartPage = this.startPage != null ? this.startPage : 0;
            this.pagesRead = Math.max(0, endPage - sessionStartPage);
        }
    }

    public void addExcludedTime(long millis) {
        this.pausedMillis = getPausedMillisOrZero() + millis;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (!(o instanceof ReadingSession))
            return false;
        ReadingSession that = (ReadingSession) o;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
