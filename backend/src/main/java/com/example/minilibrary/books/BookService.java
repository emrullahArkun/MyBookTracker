package com.example.minilibrary.books;

import com.example.minilibrary.auth.User;
import com.example.minilibrary.books.dto.CreateBookRequest;
import com.example.minilibrary.sessions.ReadingSessionService;
import com.example.minilibrary.shared.exception.DuplicateResourceException;
import com.example.minilibrary.shared.exception.ResourceNotFoundException;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Validated
public class BookService {

    private final BookRepository bookRepository;
    private final BookMapper bookMapper;
    private final ReadingSessionService readingSessionService;
    private final BookProgressService bookProgressService;

    public Page<Book> findAllByUser(User user, Pageable pageable) {
        return bookRepository.findByUserOrderByCompletedAsc(user, pageable);
    }

    public Optional<Book> findByIdAndUser(@NotNull Long id, User user) {
        return bookRepository.findByIdAndUser(id, user);
    }

    public boolean existsByIsbnAndUser(String isbn, User user) {
        return bookRepository.existsByIsbnAndUser(isbn, user);
    }

    public List<String> getAllOwnedIsbns(User user) {
        return bookRepository.findAllIsbnsByUser(user);
    }

    @Transactional
    public Book createBook(CreateBookRequest request, User user) {
        if (existsByIsbnAndUser(request.isbn(), user)) {
            throw new DuplicateResourceException(
                    "Book with ISBN " + request.isbn() + " already exists in your collection.");
        }

        Book book = bookMapper.toEntity(request);
        book.setUser(user);

        return bookRepository.save(book);
    }

    @Transactional
    public Book save(@NotNull Book book) {
        return bookRepository.save(book);
    }

    @Transactional
    public void deleteByIdAndUser(@NotNull Long id, User user) {
        Book book = bookRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        readingSessionService.deleteSessionsByBook(user, book);

        bookRepository.delete(book);
    }

    @Transactional
    public void deleteAllByUser(User user) {
        List<Book> books = bookRepository.findByUser(user);
        bookRepository.deleteAll(books);
    }

    @Transactional
    public Book updateBookProgress(@NotNull Long id, @NotNull Integer currentPage, User user) {
        Book book = findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        return bookProgressService.updateProgress(book, currentPage);
    }

    @Transactional
    public Book updateBookStatus(@NotNull Long id, @NotNull Boolean completed, User user) {
        Book book = findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        book.setCompleted(completed);
        return bookRepository.save(book);
    }

    @Transactional
    public Book updateReadingGoal(@NotNull Long id, ReadingGoalType type, Integer pages, User user) {
        Book book = findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found"));

        book.setReadingGoalType(type);
        book.setReadingGoalPages(pages);
        return bookRepository.save(book);
    }
}
