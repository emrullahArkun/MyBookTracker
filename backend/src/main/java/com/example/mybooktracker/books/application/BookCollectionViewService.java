package com.example.mybooktracker.books.application;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.books.infra.persistence.BookRepository;
import com.example.mybooktracker.sessions.application.ReadingSessionQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookCollectionViewService {

    private final BookRepository bookRepository;
    private final ReadingSessionQueryPort readingSessionQueryPort;

    public Page<Book> getSectionPage(User user, BookSection section, Pageable pageable) {
        Long activeBookId = readingSessionQueryPort.findActiveBookId(user).orElse(null);
        List<Book> sectionBooks = filterAndSort(bookRepository.findByUser(user), section, activeBookId);
        return toPage(sectionBooks, pageable);
    }

    public BookFocusView getFocus(User user, int queueLimit) {
        List<Book> books = bookRepository.findByUser(user);
        Long activeBookId = readingSessionQueryPort.findActiveBookId(user).orElse(null);

        List<Book> currentReads = filterAndSort(books, BookSection.CURRENT, activeBookId);
        List<Book> nextReads = filterAndSort(books, BookSection.NEXT, activeBookId);

        Book currentBook = !currentReads.isEmpty()
                ? currentReads.getFirst()
                : (nextReads.isEmpty() ? null : nextReads.getFirst());

        List<Book> queuedBooks = nextReads.stream()
                .filter(book -> currentBook == null || !book.getId().equals(currentBook.getId()))
                .limit(Math.max(queueLimit, 0))
                .toList();

        long activeBooksCount = books.stream()
                .filter(book -> !Boolean.TRUE.equals(book.getCompleted()))
                .count();

        long completedBooksCount = books.stream()
                .filter(book -> Boolean.TRUE.equals(book.getCompleted()))
                .count();

        return new BookFocusView(currentBook, queuedBooks, activeBooksCount, completedBooksCount);
    }

    private List<Book> filterAndSort(List<Book> books, BookSection section, Long activeBookId) {
        return books.stream()
                .filter(book -> belongsToSection(book, section))
                .sorted(comparatorFor(section, activeBookId))
                .toList();
    }

    private boolean belongsToSection(Book book, BookSection section) {
        return switch (section) {
            case CURRENT -> !Boolean.TRUE.equals(book.getCompleted()) && currentPage(book) > 0;
            case NEXT -> !Boolean.TRUE.equals(book.getCompleted()) && currentPage(book) == 0;
            case FINISHED -> Boolean.TRUE.equals(book.getCompleted());
        };
    }

    private Comparator<Book> comparatorFor(BookSection section, Long activeBookId) {
        Comparator<Book> titleComparator = Comparator.comparing(
                book -> lowerCaseTitle(book.getTitle()),
                Comparator.nullsLast(String::compareTo));

        return switch (section) {
            case CURRENT -> Comparator
                    .comparingInt((Book book) -> isActiveSessionBook(book, activeBookId) ? 0 : 1)
                    .thenComparing(Comparator.comparingInt(BookCollectionViewService::currentPage).reversed())
                    .thenComparing(titleComparator);
            case NEXT -> Comparator
                    .comparingInt((Book book) -> book.getReadingGoal().isSet() ? 0 : 1)
                    .thenComparing(titleComparator);
            case FINISHED -> Comparator
                    .comparingInt(BookCollectionViewService::currentPage)
                    .reversed()
                    .thenComparing(titleComparator);
        };
    }

    private boolean isActiveSessionBook(Book book, Long activeBookId) {
        return activeBookId != null && activeBookId.equals(book.getId());
    }

    private static int currentPage(Book book) {
        return book.getCurrentPage() != null ? book.getCurrentPage() : 0;
    }

    private static String lowerCaseTitle(String title) {
        return title == null ? null : title.toLowerCase(Locale.ROOT);
    }

    private Page<Book> toPage(List<Book> books, Pageable pageable) {
        int start = Math.toIntExact(pageable.getOffset());
        int end = Math.min(start + pageable.getPageSize(), books.size());
        List<Book> content = start >= books.size() ? List.of() : books.subList(start, end);
        return new PageImpl<>(content, pageable, books.size());
    }
}
