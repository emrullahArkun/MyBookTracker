package com.example.mybooktracker.books.application;

import com.example.mybooktracker.shared.exception.DuplicateResourceException;
import com.example.mybooktracker.shared.exception.ResourceNotFoundException;
import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.books.domain.BookCollectionChangedEvent;
import com.example.mybooktracker.books.domain.ReadingGoalType;
import com.example.mybooktracker.books.infra.persistence.BookRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static com.example.mybooktracker.support.BookFixtures.book;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock
    private BookRepository bookRepository;
    @Mock
    private CreateBookCommandMapper createBookCommandMapper;
    @Spy
    private Clock clock = Clock.systemUTC();
    @Mock
    private ApplicationEventPublisher eventPublisher;
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
        Page<Book> page = new PageImpl<>(List.of(book().build()));
        when(bookRepository.findByUserOrderByCompletedAsc(user, pageable)).thenReturn(page);

        assertEquals(1, bookService.findAllByUser(user, pageable).getTotalElements());
    }

    @Test
    void findByIdAndUser_ShouldReturnOptional() {
        Book book = book().build();
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
    void existsByIsbnAndUser_ShouldDelegateToRepository() {
        when(bookRepository.existsByIsbnAndUser("isbn123", user)).thenReturn(true);

        assertTrue(bookService.existsByIsbnAndUser("isbn123", user));
    }

    @Test
    void findBooksWithGoals_ShouldReturnMatchingBooks() {
        when(bookRepository.findByUserAndReadingGoalTypeIsNotNull(user))
                .thenReturn(List.of(book().build()));

        List<Book> result = bookService.findBooksWithGoals(user);

        assertEquals(1, result.size());
    }

    @Test
    void createBook_ShouldSaveBook() {
        CreateBookCommand command = new CreateBookCommand("isbn", "title", "author", 2023, "url", 100, List.of("cat"));
        Book book = book().isbn("isbn").title("title").author("author").publishYear(2023).coverUrl("url")
                .pageCount(100).categories(List.of("cat")).build();
        when(bookRepository.existsByIsbnAndUser("isbn", user)).thenReturn(false);
        when(createBookCommandMapper.toEntity(command)).thenReturn(book);
        when(bookRepository.saveAndFlush(any(Book.class))).thenAnswer(i -> i.getArgument(0));

        Book result = bookService.createBook(command, user);
        assertEquals(user, result.getUser());
        assertEquals(0, result.getCurrentPage());
        assertNotNull(result.getStartDate());
        assertFalse(result.getCompleted());
        verify(eventPublisher).publishEvent(new BookCollectionChangedEvent(user.getId()));
    }

    @Test
    void createBook_ShouldThrow_WhenDuplicateIsbn() {
        CreateBookCommand command = new CreateBookCommand("isbn", "title", "author", 2023, "url", 100, List.of("cat"));
        when(bookRepository.existsByIsbnAndUser("isbn", user)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> bookService.createBook(command, user));
    }

    @Test
    void createBook_ShouldTranslateConstraintViolation_WhenDuplicateRaceOccurs() {
        CreateBookCommand command = new CreateBookCommand("isbn", "title", "author", 2023, "url", 100, List.of("cat"));
        Book book = book().isbn("isbn").title("title").author("author").publishYear(2023).coverUrl("url")
                .pageCount(100).categories(List.of("cat")).build();
        when(bookRepository.existsByIsbnAndUser("isbn", user)).thenReturn(false);
        when(createBookCommandMapper.toEntity(command)).thenReturn(book);
        when(bookRepository.saveAndFlush(any(Book.class)))
                .thenThrow(new DataIntegrityViolationException("duplicate key"));

        assertThrows(DuplicateResourceException.class, () -> bookService.createBook(command, user));
    }

    @Test
    void createBook_ShouldPreserveExistingDefaults_WhenMapperAlreadySetThem() {
        CreateBookCommand command = new CreateBookCommand("isbn", "title", "author", 2023, "url", 100, List.of("cat"));
        Book book = book().isbn("isbn").title("title").author("author").publishYear(2023).coverUrl("url")
                .pageCount(100).categories(List.of("cat")).build();
        LocalDate existingStartDate = LocalDate.of(2024, 1, 10);
        book.restoreTracking(42, existingStartDate, true);

        when(bookRepository.existsByIsbnAndUser("isbn", user)).thenReturn(false);
        when(createBookCommandMapper.toEntity(command)).thenReturn(book);
        when(bookRepository.saveAndFlush(any(Book.class))).thenAnswer(i -> i.getArgument(0));

        Book result = bookService.createBook(command, user);

        assertEquals(42, result.getCurrentPage());
        assertEquals(existingStartDate, result.getStartDate());
        assertTrue(result.getCompleted());
    }

    @Test
    void deleteByIdAndUser_ShouldDeleteBookAndSessions() {
        Book book = book().id(1L).build();
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));

        bookService.deleteByIdAndUser(1L, user);

        verify(bookRepository).delete(book);
        verify(eventPublisher).publishEvent(new BookCollectionChangedEvent(user.getId()));
    }

    @Test
    void deleteByIdAndUser_ShouldThrow_WhenNotFound() {
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> bookService.deleteByIdAndUser(1L, user));
    }

    @Test
    void getBookByIdOrThrow_ShouldThrow_WhenNotFound() {
        when(bookRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> bookService.getBookByIdOrThrow(99L, user));
    }

    @Test
    void deleteAllByUser_ShouldDeleteAll() {
        bookService.deleteAllByUser(user);
        verify(bookRepository).deleteByUser(user);
        verify(eventPublisher).publishEvent(new BookCollectionChangedEvent(user.getId()));
    }

    @Test
    void updateBookProgress_ShouldUpdateProgressOnBook() {
        Book book = book().pageCount(100).build();
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));

        Book result = bookService.updateBookProgress(1L, 50, user);
        assertEquals(50, result.getCurrentPage());
        assertFalse(result.getCompleted());
    }

    @Test
    void updateBookProgress_ShouldThrow_WhenBookNotFound() {
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class,
                () -> bookService.updateBookProgress(1L, 50, user));
    }

    @Test
    void updateBookStatus_ShouldSetCompleted() {
        Book book = book().build();
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));

        Book result = bookService.updateBookStatus(1L, true, user);
        assertTrue(result.getCompleted());
    }

    @Test
    void updateBookStatus_ShouldUnsetCompleted() {
        Book book = book().build();
        book.updateStatus(true);
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));

        Book result = bookService.updateBookStatus(1L, false, user);
        assertFalse(result.getCompleted());
    }

    @Test
    void updateReadingGoal_ShouldSetGoal() {
        Book book = book().build();
        when(bookRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(book));

        Book result = bookService.updateReadingGoal(1L, ReadingGoalType.WEEKLY, 100, user);
        assertEquals(ReadingGoalType.WEEKLY, result.getReadingGoalType());
        assertEquals(100, result.getReadingGoalPages());
    }
}
