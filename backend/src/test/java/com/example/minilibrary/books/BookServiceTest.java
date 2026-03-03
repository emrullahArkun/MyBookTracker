package com.example.minilibrary.books;

import com.example.minilibrary.sessions.ReadingSessionService;
import com.example.minilibrary.books.dto.CreateBookRequest;
import com.example.minilibrary.shared.exception.DuplicateResourceException;
import com.example.minilibrary.shared.exception.ResourceNotFoundException;
import com.example.minilibrary.auth.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;
    @Mock
    private BookMapper bookMapper;
    @Mock
    private ReadingSessionService readingSessionService;
    @Mock
    private BookProgressService bookProgressService;
    @InjectMocks
    private BookService bookService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
    }

    @Test
    void findAllByUser_ShouldReturnPage() {
        Pageable pageable = PageRequest.of(0, 10);
        Page<Book> page = new PageImpl<>(List.of(new Book()));
        when(bookRepository.findByUserOrderByCompletedAsc(user, pageable)).thenReturn(page);

        assertEquals(1, bookService.findAllByUser(user, pageable).getTotalElements());
    }

    @Test
    void findByIdAndUser_ShouldReturnOptional() {
        Book book = new Book();
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));

        assertTrue(bookService.findByIdAndUser(1L, user).isPresent());
    }

    @Test
    void getAllOwnedIsbns_ShouldReturnIsbns() {
        when(bookRepository.findAllIsbnsByUser(user)).thenReturn(List.of("isbn123"));

        List<String> isbns = bookService.getAllOwnedIsbns(user);
        assertEquals(1, isbns.size());
        assertEquals("isbn123", isbns.get(0));
    }

    @Test
    void createBook_ShouldSaveBook() {
        CreateBookRequest request = new CreateBookRequest("isbn", "title", "author", "2023", "url", 100, "cat");
        Book book = new Book();
        book.setAuthor("author");
        when(bookRepository.existsByIsbnAndUser("isbn", user)).thenReturn(false);
        when(bookMapper.toEntity(request)).thenReturn(book);
        when(bookRepository.save(any(Book.class))).thenAnswer(i -> i.getArgument(0));

        Book result = bookService.createBook(request, user);
        assertEquals(user, result.getUser());
    }

    @Test
    void createBook_ShouldThrow_WhenDuplicateIsbn() {
        CreateBookRequest request = new CreateBookRequest("isbn", "title", "author", "2023", "url", 100, "cat");
        when(bookRepository.existsByIsbnAndUser("isbn", user)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> bookService.createBook(request, user));
    }

    @Test
    void deleteByIdAndUser_ShouldDeleteBookAndSessions() {
        Book book = new Book();
        book.setId(1L);
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));

        bookService.deleteByIdAndUser(1L, user);

        verify(readingSessionService).deleteSessionsByBook(user, book);
        verify(bookRepository).delete(book);
    }

    @Test
    void deleteByIdAndUser_ShouldThrow_WhenNotFound() {
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> bookService.deleteByIdAndUser(1L, user));
    }

    @Test
    void deleteAllByUser_ShouldDeleteAll() {
        List<Book> books = List.of(new Book(), new Book());
        when(bookRepository.findByUser(user)).thenReturn(books);

        bookService.deleteAllByUser(user);
        verify(bookRepository).deleteAll(books);
    }

    @Test
    void updateBookProgress_ShouldDelegateToProgressService() {
        Book book = new Book();
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));
        when(bookProgressService.updateProgress(book, 50)).thenReturn(book);

        bookService.updateBookProgress(1L, 50, user);
        verify(bookProgressService).updateProgress(book, 50);
    }

    @Test
    void updateBookProgress_ShouldThrow_WhenBookNotFound() {
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> bookService.updateBookProgress(1L, 50, user));
    }

    @Test
    void updateBookStatus_ShouldSetCompleted() {
        Book book = new Book();
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));
        when(bookRepository.save(any(Book.class))).thenAnswer(i -> i.getArgument(0));

        Book result = bookService.updateBookStatus(1L, true, user);
        assertTrue(result.getCompleted());
    }

    @Test
    void updateReadingGoal_ShouldSetGoal() {
        Book book = new Book();
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));
        when(bookRepository.save(any(Book.class))).thenAnswer(i -> i.getArgument(0));

        Book result = bookService.updateReadingGoal(1L, ReadingGoalType.WEEKLY, 100, user);
        assertEquals(ReadingGoalType.WEEKLY, result.getReadingGoalType());
        assertEquals(100, result.getReadingGoalPages());
    }

    @Test
    void save_ShouldSaveBook() {
        Book book = new Book();
        when(bookRepository.save(book)).thenReturn(book);

        assertEquals(book, bookService.save(book));
    }
}
