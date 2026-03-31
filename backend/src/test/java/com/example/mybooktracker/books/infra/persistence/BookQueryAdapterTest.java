package com.example.mybooktracker.books.infra.persistence;

import com.example.mybooktracker.auth.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BookQueryAdapterTest {

    private BookRepository bookRepository;
    private BookQueryAdapter adapter;
    private User user;

    @BeforeEach
    void setUp() {
        bookRepository = mock(BookRepository.class);
        adapter = new BookQueryAdapter(bookRepository);
        user = new User();
        user.setId(1L);
    }

    @Test
    void findTopAuthorsByUser_ShouldThrow_WhenLimitIsNotPositive() {
        assertThrows(IllegalArgumentException.class, () -> adapter.findTopAuthorsByUser(null, 0));
    }

    @Test
    void findTopCategoriesByUser_ShouldThrow_WhenLimitIsNegative() {
        assertThrows(IllegalArgumentException.class, () -> adapter.findTopCategoriesByUser(null, -1));
    }

    @Test
    void findTopAuthorsByUser_ShouldDelegate_WhenLimitIsPositive() {
        when(bookRepository.findTopAuthorsByUser(user, org.springframework.data.domain.PageRequest.of(0, 3)))
                .thenReturn(List.of("Author A"));

        List<String> result = adapter.findTopAuthorsByUser(user, 3);

        assertEquals(List.of("Author A"), result);
        verify(bookRepository).findTopAuthorsByUser(user, org.springframework.data.domain.PageRequest.of(0, 3));
    }

    @Test
    void findTopCategoriesByUser_ShouldDelegate_WhenLimitIsPositive() {
        when(bookRepository.findTopCategoriesByUser(user, org.springframework.data.domain.PageRequest.of(0, 2)))
                .thenReturn(List.of("Fantasy"));

        List<String> result = adapter.findTopCategoriesByUser(user, 2);

        assertEquals(List.of("Fantasy"), result);
        verify(bookRepository).findTopCategoriesByUser(user, org.springframework.data.domain.PageRequest.of(0, 2));
    }
}
