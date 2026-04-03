package com.example.mybooktracker.books.domain;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.shared.exception.DomainValidationException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static com.example.mybooktracker.support.BookFixtures.book;

class BookTest {

    @Test
    void prePersist_ShouldSetDefaults_WhenFieldsAreNull() {
        Book book = new Book();
        assertNull(book.getCurrentPage());
        assertNull(book.getStartDate());
        assertNull(book.getCompleted());

        book.prePersist();

        assertEquals(0, book.getCurrentPage());
        assertNull(book.getStartDate());
        assertFalse(book.getCompleted());
    }

    @Test
    void prePersist_ShouldNotOverrideExistingValues() {
        Book book = new Book();
        book.restoreTracking(50, LocalDate.of(2024, 1, 1), true);

        book.prePersist();

        assertEquals(50, book.getCurrentPage());
        assertEquals(LocalDate.of(2024, 1, 1), book.getStartDate());
        assertTrue(book.getCompleted());
    }

    @Test
    void equals_ShouldReturnTrue_ForSameId() {
        Book a = new Book();
        a.assignIdentity(1L);
        Book b = new Book();
        b.assignIdentity(1L);

        assertEquals(a, b);
    }

    @Test
    void equals_ShouldReturnFalse_ForDifferentId() {
        Book a = new Book();
        a.assignIdentity(1L);
        Book b = new Book();
        b.assignIdentity(2L);

        assertNotEquals(a, b);
    }

    @Test
    void equals_ShouldReturnTrue_ForSameInstance() {
        Book a = new Book();
        a.assignIdentity(1L);
        assertEquals(a, a);
    }

    @Test
    void equals_ShouldReturnFalse_ForNull() {
        Book a = new Book();
        a.assignIdentity(1L);
        assertNotEquals(null, a);
    }

    @Test
    void hashCode_ShouldBeConsistent() {
        Book a = new Book();
        a.assignIdentity(1L);
        Book b = new Book();
        b.assignIdentity(1L);

        assertEquals(a.hashCode(), b.hashCode());
    }

    @Test
    void equals_ShouldReturnFalse_ForDifferentType() {
        Book a = new Book();
        a.assignIdentity(1L);
        assertNotEquals("not a book", a);
    }

    @Test
    void equals_ShouldReturnFalse_WhenThisIdIsNull() {
        Book a = new Book(); // id is null
        Book b = new Book();
        b.assignIdentity(1L);

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
        a.assignIdentity(1L);
        Book b = new Book(); // id is null

        assertNotEquals(a, b);
    }

    @Test
    void hashCode_NullId_ShouldNotThrow() {
        Book a = new Book();
        assertDoesNotThrow(a::hashCode);
    }

    @Test
    void assignIdentity_ShouldThrow_WhenReassigned() {
        Book a = new Book();
        a.assignIdentity(1L);
        assertThrows(IllegalStateException.class,
                () -> a.assignIdentity(2L));
    }

    @Test
    void assignIdentity_ShouldAllowSameId() {
        Book a = new Book();
        a.assignIdentity(1L);
        assertDoesNotThrow(() -> a.assignIdentity(1L));
    }

    @Test
    void changePageCount_ShouldThrow_WhenNegative() {
        Book book = new Book();
        assertThrows(DomainValidationException.class,
                () -> book.changePageCount(-1));
    }

    @Test
    void changePageCount_ShouldThrow_WhenZero() {
        Book book = new Book();
        assertThrows(DomainValidationException.class,
                () -> book.changePageCount(0));
    }

    @Test
    void changePageCount_ShouldAllowNull() {
        Book book = new Book();
        assertDoesNotThrow(() -> book.changePageCount(null));
        assertNull(book.getPageCount());
    }

    @Test
    void create_ShouldThrow_WhenPageCountIsNotPositive() {
        assertThrows(DomainValidationException.class,
                () -> Book.create("isbn", "title", "author", 2024, "cover", 0, List.of()));
    }

    @Test
    void updateMetadata_ShouldValidatePageCount() {
        Book book = new Book();

        assertThrows(DomainValidationException.class,
                () -> book.updateMetadata("isbn", "title", "author", 2024, "cover", -1));
    }

    @Test
    void updateProgress_ShouldSetCurrentPage() {
        Book book = new Book();
        book.changePageCount(200);

        book.updateProgress(50);
        assertEquals(50, book.getCurrentPage());
    }

    @Test
    void updateProgress_ShouldAutoComplete_WhenPageReachesTotal() {
        Book book = new Book();
        book.changePageCount(200);

        book.updateProgress(200);
        assertTrue(book.getCompleted());
    }

    @Test
    void updateProgress_ShouldUnComplete_WhenPageBelowTotal() {
        Book book = new Book();
        book.changePageCount(200);
        book.restoreTracking(null, null, true);

        book.updateProgress(150);
        assertFalse(book.getCompleted());
    }

    @Test
    void updateProgress_ShouldNotSetCompleted_WhenPageCountIsNull() {
        Book book = new Book();
        book.changePageCount(null);

        book.updateProgress(50);
        assertEquals(50, book.getCurrentPage());
        assertNull(book.getCompleted());
    }

    @Test
    void updateProgress_ShouldThrow_WhenPageNegative() {
        Book book = new Book();
        assertThrows(DomainValidationException.class,
                () -> book.updateProgress(-1));
    }

    @Test
    void updateStatus_ShouldSetCompleted() {
        Book book = new Book();
        book.updateStatus(true);
        assertTrue(book.getCompleted());
    }

    @Test
    void updateStatus_ShouldSetCurrentPageToTotal_WhenCompleted() {
        Book book = new Book();
        book.changePageCount(200);
        book.restoreTracking(50, null, null);

        book.updateStatus(true);
        assertTrue(book.getCompleted());
        assertEquals(200, book.getCurrentPage());
    }

    @Test
    void updateStatus_ShouldNotChangeCurrentPage_WhenNotCompleted() {
        Book book = new Book();
        book.changePageCount(200);
        book.restoreTracking(50, null, null);

        book.updateStatus(false);
        assertFalse(book.getCompleted());
        assertEquals(50, book.getCurrentPage());
    }

    @Test
    void updateStatus_ShouldNotChangeCurrentPage_WhenPageCountIsNull() {
        Book book = new Book();
        book.restoreTracking(50, null, null);

        book.updateStatus(true);
        assertTrue(book.getCompleted());
        assertEquals(50, book.getCurrentPage());
    }

    @Test
    void updateProgress_ShouldThrow_WhenPageExceedsTotal() {
        Book book = new Book();
        book.changePageCount(200);
        assertThrows(DomainValidationException.class,
                () -> book.updateProgress(201));
    }

    @Test
    void restore_ShouldSetFields() {
        User user = new User();
        Book book = book()
                .id(1L)
                .isbn("isbn")
                .title("title")
                .author("author")
                .user(user)
                .publishYear(2023)
                .coverUrl("url")
                .pageCount(300)
                .currentPage(50)
                .startDate(LocalDate.now())
                .completed(false)
                .goal(ReadingGoalType.WEEKLY, 100)
                .categories(List.of("Fiction"))
                .build();

        assertEquals(1L, book.getId());
        assertEquals("isbn", book.getIsbn());
        assertEquals("author", book.getAuthor());
        assertEquals(user, book.getUser());
        assertEquals(ReadingGoalType.WEEKLY, book.getReadingGoal().getType());
        assertEquals(List.of("Fiction"), book.getCategories());
    }
}
