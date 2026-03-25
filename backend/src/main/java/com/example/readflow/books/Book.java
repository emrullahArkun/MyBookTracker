package com.example.readflow.books;

import com.example.readflow.auth.User;
import com.example.readflow.sessions.ReadingSession;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
// A user cannot have duplicate books with the same ISBN
@Table(name = "books", indexes = {
        @Index(name = "idx_book_user", columnList = "user_id"),
        @Index(name = "idx_book_isbn", columnList = "isbn")
}, uniqueConstraints = {
        @UniqueConstraint(columnNames = { "user_id", "isbn" })
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    private String isbn;
    private String title;

    private String author;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private Integer publishYear;
    private String coverUrl;

    private Integer pageCount;
    private Integer currentPage;
    private LocalDate startDate;
    private Boolean completed;

    @Enumerated(EnumType.STRING)
    private ReadingGoalType readingGoalType;
    private Integer readingGoalPages;

    @ElementCollection
    @CollectionTable(name = "book_categories", joinColumns = @JoinColumn(name = "book_id"))
    @Column(name = "category")
    private List<String> categories = new ArrayList<>();

    // Deleting a book cascades to all its reading sessions
    @OneToMany(mappedBy = "book", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReadingSession> readingSessions = new ArrayList<>();

    // Helper methods to keep both sides of the bidirectional relationship in sync
    public void addReadingSession(ReadingSession session) {
        readingSessions.add(session);
        session.setBook(this);
    }

    public void removeReadingSession(ReadingSession session) {
        readingSessions.remove(session);
        session.setBook(null);
    }

    public void updateProgress(Integer newPage) {
        if (newPage == null) {
            throw new IllegalArgumentException("Current page is required");
        }
        if (newPage < 0) {
            throw new IllegalArgumentException("Current page cannot be negative");
        }
        if (this.pageCount != null && newPage > this.pageCount) {
            throw new IllegalArgumentException("Current page cannot exceed total page count");
        }

        this.currentPage = newPage;

        if (this.pageCount != null) {
            this.completed = (newPage >= this.pageCount);
        }
    }

    public void updateStatus(Boolean completed) {
        this.completed = completed;

        if (Boolean.TRUE.equals(completed) && this.pageCount != null) {
            this.currentPage = this.pageCount;
        }
    }

    // Set sensible defaults before first save
    @PrePersist
    public void prePersist() {
        if (currentPage == null) {
            currentPage = 0;
        }
        if (completed == null) {
            completed = false;
        }
    }
}
