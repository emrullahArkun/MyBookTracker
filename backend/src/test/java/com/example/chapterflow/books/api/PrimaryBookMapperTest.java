package com.example.chapterflow.books.api;

import com.example.chapterflow.books.api.dto.BookDto;
import com.example.chapterflow.books.domain.Book;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class PrimaryBookMapperTest {

    private final PrimaryBookMapper mapper = new PrimaryBookMapper();

    @Test
    void toDto_ShouldReturnNull_WhenBookIsNull() {
        assertNull(mapper.toDto(null));
    }

    @Test
    void toDto_ShouldUseEmptyCategories_WhenBookCategoriesAreNull() {
        Book book = new Book();
        book.setId(7L);
        book.setTitle("The Left Hand of Darkness");
        book.setCategories(null);

        BookDto dto = mapper.toDto(book);

        assertNotNull(dto);
        assertEquals(7L, dto.id());
        assertEquals(List.of(), dto.categories());
    }

    @Test
    void toDto_ShouldCopyCategories_WhenBookCategoriesExist() {
        Book book = new Book();
        book.setCategories(List.of("Sci-Fi", "Classic"));

        BookDto dto = mapper.toDto(book);

        assertEquals(List.of("Sci-Fi", "Classic"), dto.categories());
    }
}
