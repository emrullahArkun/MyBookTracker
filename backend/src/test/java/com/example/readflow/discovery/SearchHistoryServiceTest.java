package com.example.readflow.discovery;

import com.example.readflow.auth.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchHistoryServiceTest {

    @Mock
    private SearchHistoryRepository searchHistoryRepository;

    @Spy
    private Clock clock = Clock.systemUTC();

    @InjectMocks
    private SearchHistoryService searchHistoryService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
    }

    @Test
    void logSearch_ShouldSave_WhenQueryValid() {
        when(searchHistoryRepository.existsByUserAndQueryAndTimestampAfter(eq(user), eq("test"), any()))
                .thenReturn(false);
        when(searchHistoryRepository.countByUser(user)).thenReturn(0L);

        searchHistoryService.logSearch("test", user);
        verify(searchHistoryRepository).save(any());
    }

    @Test
    void logSearch_ShouldSkip_WhenQueryNull() {
        searchHistoryService.logSearch(null, user);
        verify(searchHistoryRepository, never()).save(any());
    }

    @Test
    void logSearch_ShouldSkip_WhenQueryEmpty() {
        searchHistoryService.logSearch("   ", user);
        verify(searchHistoryRepository, never()).save(any());
    }

    @Test
    void logSearch_ShouldSkip_WhenDuplicate() {
        when(searchHistoryRepository.existsByUserAndQueryAndTimestampAfter(eq(user), eq("test"), any()))
                .thenReturn(true);

        searchHistoryService.logSearch("test", user);
        verify(searchHistoryRepository, never()).save(any());
    }

    @Test
    void logSearch_ShouldDeleteOldest_WhenOverLimit() {
        when(searchHistoryRepository.existsByUserAndQueryAndTimestampAfter(eq(user), eq("test"), any()))
                .thenReturn(false);
        when(searchHistoryRepository.countByUser(user)).thenReturn(50L);

        searchHistoryService.logSearch("test", user);
        verify(searchHistoryRepository).deleteOldestByUserId(user.getId());
        verify(searchHistoryRepository).save(any());
    }

    @Test
    void getRecentSearches_ShouldReturnLimitedList() {
        when(searchHistoryRepository.findDistinctQueriesByUserOrderByTimestampDesc(user))
                .thenReturn(List.of("q1", "q2", "q3"));

        List<String> result = searchHistoryService.getRecentSearches(user, 2);
        assertEquals(2, result.size());
    }
}
