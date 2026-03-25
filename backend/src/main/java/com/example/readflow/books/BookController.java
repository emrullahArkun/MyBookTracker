package com.example.readflow.books;

import com.example.readflow.auth.User;
import com.example.readflow.books.dto.BookDto;
import com.example.readflow.books.dto.CreateBookRequest;
import com.example.readflow.books.dto.SetGoalRequest;
import com.example.readflow.books.dto.UpdateProgressRequest;
import com.example.readflow.books.dto.UpdateStatusRequest;
import com.example.readflow.shared.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;
    private final BookMapper bookMapper;
    private final ReadingGoalProgressCalculator progressCalculator;

    @GetMapping
    public ResponseEntity<Page<BookDto>> getAllBooks(
            @PageableDefault(size = 10) Pageable pageable,
            @CurrentUser User user) {
        Page<Book> bookPage = bookService.findAllByUser(user, pageable);
        Map<Long, Integer> progressMap = progressCalculator.calculateProgressBatch(bookPage.getContent());

        Page<BookDto> dtoPage = bookPage.map(book -> toDtoWithProgress(book, progressMap.get(book.getId())));

        return ResponseEntity.ok(dtoPage);
    }

    @GetMapping("/owned")
    public ResponseEntity<List<String>> getAllOwnedIsbns(@CurrentUser User user) {
        return ResponseEntity.ok(bookService.getAllOwnedIsbns(user));
    }

    @GetMapping("/with-goals")
    public ResponseEntity<List<BookDto>> getBooksWithGoals(@CurrentUser User user) {
        List<Book> books = bookService.findBooksWithGoals(user);
        Map<Long, Integer> progressMap = progressCalculator.calculateProgressBatch(books);

        List<BookDto> dtos = books.stream()
                .map(book -> toDtoWithProgress(book, progressMap.get(book.getId())))
                .toList();

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookDto> getBookById(@PathVariable Long id, @CurrentUser User user) {
        Book book = bookService.getBookByIdOrThrow(id, user);
        return ResponseEntity.ok(toDtoWithProgress(book));
    }

    @PostMapping
    public ResponseEntity<BookDto> createBook(
            @RequestBody @Valid CreateBookRequest request,
            @CurrentUser User user) {
        Book savedBook = bookService.createBook(request, user);

        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(savedBook.getId())
                .toUri();

        return ResponseEntity.created(location).body(toDtoWithProgress(savedBook));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<BookDto> updateBookProgress(
            @PathVariable Long id,
            @RequestBody @Valid UpdateProgressRequest request,
            @CurrentUser User user) {
        Book updatedBook = bookService.updateBookProgress(id, request.currentPage(), user);
        return ResponseEntity.ok(toDtoWithProgress(updatedBook));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<BookDto> updateBookStatus(
            @PathVariable Long id,
            @RequestBody @Valid UpdateStatusRequest request,
            @CurrentUser User user) {
        Book updatedBook = bookService.updateBookStatus(id, request.completed(), user);
        return ResponseEntity.ok(toDtoWithProgress(updatedBook));
    }

    @PatchMapping("/{id}/goal")
    public ResponseEntity<BookDto> updateBookGoal(
            @PathVariable Long id,
            @RequestBody @Valid SetGoalRequest request,
            @CurrentUser User user) {
        Book updatedBook = bookService.updateReadingGoal(id, request.type(), request.pages(), user);
        return ResponseEntity.ok(toDtoWithProgress(updatedBook));
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

    private BookDto toDtoWithProgress(Book book) {
        return toDtoWithProgress(book, progressCalculator.calculateProgress(book));
    }

    private BookDto toDtoWithProgress(Book book, Integer progress) {
        BookDto dto = bookMapper.toDto(book);
        return progress != null ? BookDto.copyWithProgress(dto, progress) : dto;
    }
}
