package com.example.readflow.books;

import com.example.readflow.books.dto.BookDto;
import com.example.readflow.books.dto.CreateBookRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import static org.junit.jupiter.api.Assertions.*;

import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.test.util.ReflectionTestUtils;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

class BookMapperTest {

    private BookMapper mapper;

    @Mock
    private ReadingGoalProgressCalculator calculator;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mapper = Mappers.getMapper(BookMapper.class);
        ReflectionTestUtils.setField(mapper, "calculator", calculator);
    }

    // --- toDto tests ---

    @Test
    void toDto_ShouldMapAllFields() {
        Book book = createBook();
        book.setAuthor("John Doe");
        book.setCategories("Fiction, Thriller");

        when(calculator.calculateProgress(any(Book.class))).thenReturn(25);

        BookDto dto = mapper.toDto(book);

        assertEquals(1L, dto.id());
        assertEquals("isbn123", dto.isbn());
        assertEquals("Test Book", dto.title());
        assertEquals("John Doe", dto.authorName());
        assertEquals("2023", dto.publishDate());
        assertEquals("http://cover.jpg", dto.coverUrl());
        assertEquals(300, dto.pageCount());
        assertEquals(50, dto.currentPage());
        assertEquals("Fiction, Thriller", dto.categories());
        assertEquals(25, dto.readingGoalProgress());
    }

    @Test
    void toDto_ShouldHandleNullFields() {
        Book book = new Book();
        book.setId(1L);
        book.setIsbn("isbn");
        book.setTitle("title");

        when(calculator.calculateProgress(any(Book.class))).thenReturn(null);

        BookDto dto = mapper.toDto(book);

        assertEquals(1L, dto.id());
        assertNull(dto.authorName());
        assertNull(dto.coverUrl());
        assertNull(dto.categories());
        assertNull(dto.readingGoalType());
        assertNull(dto.readingGoalProgress());
    }

    // --- toEntity tests ---

    @Test
    void toEntity_ShouldMapRequestToBook() {
        CreateBookRequest request = new CreateBookRequest(
                "isbn123", "Test Book", "John Doe", "2023", "http://cover.jpg", 300, "Thriller");

        Book book = mapper.toEntity(request);

        assertEquals("isbn123", book.getIsbn());
        assertEquals("Test Book", book.getTitle());
        assertEquals("John Doe", book.getAuthor());
        assertEquals("2023", book.getPublishDate());
        assertEquals("http://cover.jpg", book.getCoverUrl());
        assertEquals(300, book.getPageCount());
        assertEquals("Thriller", book.getCategories());
        // Ignored fields
        assertNull(book.getId());
        assertNull(book.getCurrentPage());
        assertNull(book.getUser());
    }

    // --- Helper ---

    private Book createBook() {
        Book book = new Book();
        book.setId(1L);
        book.setIsbn("isbn123");
        book.setTitle("Test Book");
        book.setPublishDate("2023");
        book.setCoverUrl("http://cover.jpg");
        book.setPageCount(300);
        book.setCurrentPage(50);
        return book;
    }
}
