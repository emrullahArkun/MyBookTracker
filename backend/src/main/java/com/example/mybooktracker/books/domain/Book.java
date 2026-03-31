package com.example.mybooktracker.books.domain;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.sessions.domain.ReadingSession;
import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

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
@NoArgsConstructor
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

    public static Book create(
            String isbn,
            String title,
            String author,
            Integer publishYear,
            String coverUrl,
            Integer pageCount,
            List<String> categories) {
        Book book = new Book();
        book.isbn = isbn;
        book.title = title;
        book.author = author;
        book.publishYear = publishYear;
        book.coverUrl = coverUrl;
        book.pageCount = pageCount;
        book.replaceCategories(categories);
        return book;
    }

    public static Book restore(
            Long id,
            String isbn,
            String title,
            String author,
            User user,
            Integer publishYear,
            String coverUrl,
            Integer pageCount,
            Integer currentPage,
            LocalDate startDate,
            Boolean completed,
            ReadingGoalType readingGoalType,
            Integer readingGoalPages,
            List<String> categories) {
        Book book = create(isbn, title, author, publishYear, coverUrl, pageCount, categories);
        book.id = id;
        book.user = user;
        book.currentPage = currentPage;
        book.startDate = startDate;
        book.completed = completed;
        book.readingGoalType = readingGoalType;
        book.readingGoalPages = readingGoalPages;
        return book;
    }

    public void assignIdentity(Long id) {
        this.id = id;
    }

    public void updateMetadata(
            String isbn,
            String title,
            String author,
            Integer publishYear,
            String coverUrl,
            Integer pageCount) {
        this.isbn = isbn;
        this.title = title;
        this.author = author;
        this.publishYear = publishYear;
        this.coverUrl = coverUrl;
        this.pageCount = pageCount;
    }

    public void changePageCount(Integer pageCount) {
        this.pageCount = pageCount;
    }

    public void restoreTracking(Integer currentPage, LocalDate startDate, Boolean completed) {
        this.currentPage = currentPage;
        this.startDate = startDate;
        this.completed = completed;
    }

    // Helper methods to keep both sides of the bidirectional relationship in sync
    public void addReadingSession(ReadingSession session) {
        readingSessions.add(session);
        session.attachToBook(this);
    }

    public void removeReadingSession(ReadingSession session) {
        readingSessions.remove(session);
        session.attachToBook(null);
    }

    public void assignToUser(User user) {
        this.user = user;
    }

    public void replaceCategories(List<String> categories) {
        this.categories = categories == null ? new ArrayList<>() : new ArrayList<>(categories);
    }

    public void updateReadingGoal(ReadingGoalType type, Integer pages) {
        if (type == null && pages != null) {
            throw new IllegalArgumentException("Reading goal pages require a reading goal type");
        }
        if (pages != null && pages <= 0) {
            throw new IllegalArgumentException("Reading goal pages must be positive");
        }

        this.readingGoalType = type;
        this.readingGoalPages = pages;
    }

    public void initializeTracking(LocalDate today) {
        if (this.currentPage == null) {
            this.currentPage = 0;
        }
        if (this.startDate == null) {
            this.startDate = today;
        }
        if (this.completed == null) {
            this.completed = false;
        }
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
        initializeTracking(null);
    }
}
