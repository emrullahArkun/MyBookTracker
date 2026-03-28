package com.example.chapterflow.books.application;

import com.example.chapterflow.books.domain.Book;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

class PrimaryCreateBookCommandMapperTest {

    private final PrimaryCreateBookCommandMapper mapper = new PrimaryCreateBookCommandMapper();

    @Test
    void toEntity_ShouldReturnNull_WhenCommandIsNull() {
        assertNull(mapper.toEntity(null));
    }

    @Test
    void toEntity_ShouldLeaveCategoriesUnset_WhenCommandHasNoCategories() {
        CreateBookCommand command = new CreateBookCommand(
                "9780156027328",
                "Life of Pi",
                "Yann Martel",
                2001,
                "cover.jpg",
                319,
                null);

        Book book = mapper.toEntity(command);

        assertNotNull(book);
        assertEquals("Life of Pi", book.getTitle());
        assertEquals(List.of(), book.getCategories());
    }

    @Test
    void toEntity_ShouldCopyCategories_WhenCommandHasCategories() {
        CreateBookCommand command = new CreateBookCommand(
                "9780141182803",
                "1984",
                "George Orwell",
                1949,
                "cover.jpg",
                328,
                List.of("Dystopia", "Classic"));

        Book book = mapper.toEntity(command);

        assertEquals(List.of("Dystopia", "Classic"), book.getCategories());
    }
}
