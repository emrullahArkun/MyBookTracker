package com.example.readflow.books;

import com.example.readflow.auth.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class BookTest {

    @Test
    void prePersist_ShouldSetDefaults_WhenFieldsAreNull() {
        Book book = new Book();
        assertNull(book.getCurrentPage());
        assertNull(book.getStartDate());
        assertNull(book.getCompleted());

        book.prePersist();

        assertEquals(0, book.getCurrentPage());
        assertEquals(LocalDate.now(), book.getStartDate());
        assertFalse(book.getCompleted());
    }

    @Test
    void prePersist_ShouldNotOverrideExistingValues() {
        Book book = new Book();
        book.setCurrentPage(50);
        book.setStartDate(LocalDate.of(2024, 1, 1));
        book.setCompleted(true);

        book.prePersist();

        assertEquals(50, book.getCurrentPage());
        assertEquals(LocalDate.of(2024, 1, 1), book.getStartDate());
        assertTrue(book.getCompleted());
    }

    @Test
    void equals_ShouldReturnTrue_ForSameId() {
        Book a = new Book();
        a.setId(1L);
        Book b = new Book();
        b.setId(1L);

        assertEquals(a, b);
    }

    @Test
    void equals_ShouldReturnFalse_ForDifferentId() {
        Book a = new Book();
        a.setId(1L);
        Book b = new Book();
        b.setId(2L);

        assertNotEquals(a, b);
    }

    @Test
    void equals_ShouldReturnTrue_ForSameInstance() {
        Book a = new Book();
        a.setId(1L);
        assertEquals(a, a);
    }

    @Test
    void equals_ShouldReturnFalse_ForNull() {
        Book a = new Book();
        a.setId(1L);
        assertNotEquals(null, a);
    }

    @Test
    void hashCode_ShouldBeConsistent() {
        Book a = new Book();
        a.setId(1L);
        Book b = new Book();
        b.setId(1L);

        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void equals_ShouldReturnFalse_ForDifferentType() {
        Book a = new Book();
        a.setId(1L);
        assertNotEquals("not a book", a);
    }

    @Test
    void equals_ShouldReturnFalse_WhenThisIdIsNull() {
        Book a = new Book(); // id is null
        Book b = new Book();
        b.setId(1L);

        assertNotEquals(a, b);
    }

    @Test
    void equals_ShouldReturnTrue_WhenBothIdsAreNull() {
        Book a = new Book();
        Book b = new Book();

        assertEquals(a, b);
    }

    @Test
    void equals_ShouldReturnFalse_WhenOtherIdIsNull() {
        Book a = new Book();
        a.setId(1L);
        Book b = new Book(); // id is null

        assertNotEquals(a, b);
    }

    @Test
    void hashCode_NullId_ShouldNotThrow() {
        Book a = new Book();
        assertDoesNotThrow(a::hashCode);
    }

    @Test
    void allArgsConstructor_ShouldSetFields() {
        User user = new User();
        Book book = new Book(1L, "isbn", "title", "author", user,
                "2023", "url", 300, 50, LocalDate.now(), false,
                ReadingGoalType.WEEKLY, 100, "Fiction", new ArrayList<>());

        assertEquals(1L, book.getId());
        assertEquals("isbn", book.getIsbn());
        assertEquals("author", book.getAuthor());
        assertEquals(user, book.getUser());
        assertEquals(ReadingGoalType.WEEKLY, book.getReadingGoalType());
        assertEquals("Fiction", book.getCategories());
    }
}
