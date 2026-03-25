package com.example.readflow.books;

import com.example.readflow.books.dto.BookDto;
import com.example.readflow.books.dto.CreateBookRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BookMapperTest {

    private BookMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new BookMapperImpl();
    }

    // --- toDto tests ---

    @Test
    void toDto_ShouldMapAllFields() {
        Book book = createBook();
        book.setAuthor("John Doe");
        book.setCategories(List.of("Fiction", "Thriller"));

        BookDto dto = mapper.toDto(book);

        assertEquals(1L, dto.id());
        assertEquals("isbn123", dto.isbn());
        assertEquals("Test Book", dto.title());
        assertEquals("John Doe", dto.authorName());
        assertEquals(2023, dto.publishYear());
        assertEquals("http://cover.jpg", dto.coverUrl());
        assertEquals(300, dto.pageCount());
        assertEquals(50, dto.currentPage());
        assertEquals(List.of("Fiction", "Thriller"), dto.categories());
        assertNull(dto.readingGoalProgress()); // Progress is set separately, not by mapper
    }

    @Test
    void toDto_ShouldHandleNullFields() {
        Book book = new Book();
        book.setId(1L);
        book.setIsbn("isbn");
        book.setTitle("title");

        BookDto dto = mapper.toDto(book);

        assertEquals(1L, dto.id());
        assertNull(dto.authorName());
        assertNull(dto.coverUrl());
        assertTrue(dto.categories().isEmpty());
        assertNull(dto.readingGoalType());
        assertNull(dto.readingGoalProgress());
    }

    // --- toEntity tests ---

    @Test
    void toEntity_ShouldMapRequestToBook() {
        CreateBookRequest request = new CreateBookRequest(
                "isbn123", "Test Book", "John Doe", 2023, "http://cover.jpg", 300, List.of("Thriller"));

        Book book = mapper.toEntity(request);

        assertEquals("isbn123", book.getIsbn());
        assertEquals("Test Book", book.getTitle());
        assertEquals("John Doe", book.getAuthor());
        assertEquals(2023, book.getPublishYear());
        assertEquals("http://cover.jpg", book.getCoverUrl());
        assertEquals(300, book.getPageCount());
        assertEquals(List.of("Thriller"), book.getCategories());
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
        book.setPublishYear(2023);
        book.setCoverUrl("http://cover.jpg");
        book.setPageCount(300);
        book.setCurrentPage(50);
        return book;
    }
}
