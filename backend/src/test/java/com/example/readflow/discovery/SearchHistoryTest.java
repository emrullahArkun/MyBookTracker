package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class SearchHistoryTest {

    @Test
    void prePersist_ShouldSetTimestamp_WhenNull() {
        SearchHistory history = new SearchHistory();
        assertNull(history.getTimestamp());

        history.prePersist();

        assertNotNull(history.getTimestamp());
    }

    @Test
    void prePersist_ShouldNotOverrideExistingTimestamp() {
        LocalDateTime fixed = LocalDateTime.of(2024, 6, 15, 10, 0);
        SearchHistory history = new SearchHistory();
        history.setTimestamp(fixed);

        history.prePersist();

        assertEquals(fixed, history.getTimestamp());
    }

    @Test
    void builder_ShouldCreateInstance() {
        User user = new User();
        LocalDateTime now = LocalDateTime.now();

        SearchHistory history = SearchHistory.builder()
                .id(1L)
                .query("Java books")
                .user(user)
                .timestamp(now)
                .build();

        assertEquals(1L, history.getId());
        assertEquals("Java books", history.getQuery());
        assertEquals(user, history.getUser());
        assertEquals(now, history.getTimestamp());
    }

    @Test
    void allArgsConstructor_ShouldSetFields() {
        User user = new User();
        LocalDateTime now = LocalDateTime.now();

        SearchHistory history = new SearchHistory(1L, "query", user, now);

        assertEquals(1L, history.getId());
        assertEquals("query", history.getQuery());
        assertEquals(user, history.getUser());
        assertEquals(now, history.getTimestamp());
    }
}
