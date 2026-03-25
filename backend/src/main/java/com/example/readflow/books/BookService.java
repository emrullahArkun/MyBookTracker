package com.example.readflow.books;

import com.example.readflow.auth.User;
import com.example.readflow.books.dto.CreateBookRequest;
import com.example.readflow.shared.exception.DuplicateResourceException;
import com.example.readflow.shared.exception.ResourceNotFoundException;
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
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;
    private final BookMapper bookMapper;

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
        return bookRepository.findByUserAndReadingGoalTypeIsNotNull(user);
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
    public void deleteByIdAndUser(@NotNull Long id, User user) {
        Book book = getBookByIdOrThrow(id, user);
        bookRepository.delete(book);
    }

    @Transactional
    public void deleteAllByUser(User user) {
        bookRepository.deleteByUser(user);
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

        book.setReadingGoalType(type);
        book.setReadingGoalPages(pages);
        return book;
    }
}
