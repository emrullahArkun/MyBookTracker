package com.example.mybooktracker.books.application;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.books.domain.BookCollectionChangedEvent;
import com.example.mybooktracker.books.domain.ReadingGoalType;
import com.example.mybooktracker.books.infra.persistence.BookRepository;
import com.example.mybooktracker.shared.exception.DuplicateResourceException;
import com.example.mybooktracker.shared.exception.ResourceNotFoundException;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Validated
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final CreateBookCommandMapper createBookCommandMapper;
    private final Clock clock;
    private final ApplicationEventPublisher eventPublisher;

    public Page<Book> findAllByUser(User user, Pageable pageable) {
        return bookRepository.findByUserOrderByCompletedAsc(user, pageable);
    }

    public Optional<Book> findByIdAndUser(@NotNull Long id, User user) {
        return bookRepository.findByIdAndUser(id, user);
    }

    public Book getBookByIdOrThrow(@NotNull Long id, User user) {
        return findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
    }

    public boolean existsByIsbnAndUser(String isbn, User user) {
        return bookRepository.existsByIsbnAndUser(isbn, user);
    }

    public List<String> getAllOwnedIsbns(User user) {
        return bookRepository.findAllIsbnsByUser(user);
    }

    public List<Book> findBooksWithGoals(User user) {
        return bookRepository.findByUserAndReadingGoal_TypeIsNotNull(user);
    }

    @Transactional
    public Book createBook(CreateBookCommand command, User user) {
        if (existsByIsbnAndUser(command.isbn(), user)) {
            throw duplicateIsbnException(command.isbn());
        }

        Book book = createBookCommandMapper.toEntity(command);
        book.assignToUser(user);
        applyDefaults(book);

        try {
            Book savedBook = bookRepository.saveAndFlush(book);
            publishCollectionChanged(user);
            return savedBook;
        } catch (DataIntegrityViolationException e) {
            throw duplicateIsbnException(command.isbn());
        }
    }

    @Transactional
    public void deleteByIdAndUser(@NotNull Long id, User user) {
        Book book = getBookByIdOrThrow(id, user);
        bookRepository.delete(book);
        publishCollectionChanged(user);
    }

    @Transactional
    public void deleteAllByUser(User user) {
        bookRepository.deleteByUser(user);
        publishCollectionChanged(user);
    }

    @Transactional
    public Book updateBookProgress(@NotNull Long id, @NotNull Integer currentPage, User user) {
        Book book = getBookByIdOrThrow(id, user);
        book.updateProgress(currentPage);
        return book;
    }

    @Transactional
    public Book updateBookStatus(@NotNull Long id, @NotNull Boolean completed, User user) {
        Book book = getBookByIdOrThrow(id, user);
        book.updateStatus(completed);
        return book;
    }

    @Transactional
    public Book updateReadingGoal(@NotNull Long id, ReadingGoalType type, Integer pages, User user) {
        Book book = getBookByIdOrThrow(id, user);

        book.updateReadingGoal(type, pages);
        return book;
    }

    private void applyDefaults(Book book) {
        book.initializeTracking(LocalDate.now(clock));
    }

    private DuplicateResourceException duplicateIsbnException(String isbn) {
        return new DuplicateResourceException("Book with ISBN " + isbn + " already exists in your collection.");
    }

    // Observer pattern: publish a domain event so side effects stay decoupled from write operations.
    private void publishCollectionChanged(User user) {
        eventPublisher.publishEvent(new BookCollectionChangedEvent(user.getId()));
    }
}
