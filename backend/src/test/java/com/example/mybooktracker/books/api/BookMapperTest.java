package com.example.mybooktracker.books.api;

import com.example.mybooktracker.books.api.dto.BookDto;
import com.example.mybooktracker.books.domain.Book;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static com.example.mybooktracker.support.BookFixtures.book;

class BookMapperTest {

    private final BookMapper mapper = new BookMapper();

    @Test
    void toDto_ShouldReturnNull_WhenBookIsNull() {
        assertNull(mapper.toDto(null));
    }

    @Test
    void toDto_ShouldUseEmptyCategories_WhenBookCategoriesAreNull() {
        Book book = book().id(7L).title("The Left Hand of Darkness").build();

        BookDto dto = mapper.toDto(book);

        assertNotNull(dto);
        assertEquals(7L, dto.id());
        assertEquals(List.of(), dto.categories());
    }

    @Test
    void toDto_ShouldCopyCategories_WhenBookCategoriesExist() {
        Book book = book().categories(List.of("Sci-Fi", "Classic")).build();

        BookDto dto = mapper.toDto(book);

        assertEquals(List.of("Sci-Fi", "Classic"), dto.categories());
    }
}
