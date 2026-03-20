package com.example.readflow.books;

import com.example.readflow.auth.User;
import com.example.readflow.books.dto.BookDto;
import com.example.readflow.books.dto.CreateBookRequest;
import com.example.readflow.books.dto.SetGoalRequest;
import com.example.readflow.books.dto.UpdateProgressRequest;
import com.example.readflow.books.dto.UpdateStatusRequest;
import com.example.readflow.shared.exception.ResourceNotFoundException;
import com.example.readflow.shared.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final BookMapper bookMapper;

    @GetMapping
    public Page<BookDto> getAllBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @CurrentUser User user) {
        Pageable pageable = PageRequest.of(page, size);
        return bookService.findAllByUser(user, pageable)
                .map(bookMapper::toDto);
    }

    @GetMapping("/owned")
    public List<String> getAllOwnedIsbns(@CurrentUser User user) {
        return bookService.getAllOwnedIsbns(user);
    }

    @GetMapping("/with-goals")
    public List<BookDto> getBooksWithGoals(@CurrentUser User user) {
        return bookService.findBooksWithGoals(user).stream()
                .map(bookMapper::toDto)
                .toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDto> getBookById(@PathVariable Long id, @CurrentUser User user) {
        Book book = bookService.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found with id: " + id));
        return ResponseEntity.ok(bookMapper.toDto(book));
    }

    @PostMapping
    public ResponseEntity<BookDto> createBook(
            @RequestBody @Valid CreateBookRequest request,
            @CurrentUser User user) {
        Book savedBook = bookService.createBook(request, user);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookMapper.toDto(savedBook));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<BookDto> updateBookProgress(
            @PathVariable Long id,
            @RequestBody @Valid UpdateProgressRequest request,
            @CurrentUser User user) {
        Book updatedBook = bookService.updateBookProgress(id, request.currentPage(), user);
        return ResponseEntity.ok(bookMapper.toDto(updatedBook));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BookDto> updateBookStatus(
            @PathVariable Long id,
            @RequestBody @Valid UpdateStatusRequest request,
            @CurrentUser User user) {
        Book updatedBook = bookService.updateBookStatus(id, request.completed(), user);
        return ResponseEntity.ok(bookMapper.toDto(updatedBook));
    }

    @PatchMapping("/{id}/goal")
    public ResponseEntity<BookDto> updateBookGoal(
            @PathVariable Long id,
            @RequestBody @Valid SetGoalRequest request,
            @CurrentUser User user) {
        Book updatedBook = bookService.updateReadingGoal(id, request.type(), request.pages(), user);
        return ResponseEntity.ok(bookMapper.toDto(updatedBook));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBook(@PathVariable Long id, @CurrentUser User user) {
        bookService.deleteByIdAndUser(id, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllBooks(@CurrentUser User user) {
        bookService.deleteAllByUser(user);
        return ResponseEntity.noContent().build();
    }
}
