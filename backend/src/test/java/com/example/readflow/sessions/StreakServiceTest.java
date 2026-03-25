package com.example.readflow.sessions;

import com.example.readflow.auth.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StreakServiceTest {

    @Mock
    private ReadingSessionRepository sessionRepository;

    @InjectMocks
    private StreakService streakService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
    }

    @Test
    void calculateStreaks_ShouldReturnZeros_WhenNoReadingDays() {
        when(sessionRepository.findAllDistinctReadingDays(eq(user), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());

        StreakService.StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(0, result.current());
        assertEquals(0, result.longest());
    }

    @Test
    void calculateStreaks_ShouldCountConsecutiveDays_IncludingToday() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(sessionRepository.findAllDistinctReadingDays(eq(user), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(today, today.minusDays(1), today.minusDays(2)));

        StreakService.StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(3, result.current());
        assertEquals(3, result.longest());
    }

    @Test
    void calculateStreaks_ShouldCountFromYesterday_WhenNoSessionToday() {
        LocalDate yesterday = LocalDate.now(ZoneOffset.UTC).minusDays(1);
        when(sessionRepository.findAllDistinctReadingDays(eq(user), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(yesterday, yesterday.minusDays(1)));

        StreakService.StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(2, result.current());
        assertEquals(2, result.longest());
    }

    @Test
    void calculateStreaks_ShouldBreakCurrentOnGap() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(sessionRepository.findAllDistinctReadingDays(eq(user), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(today, today.minusDays(1), today.minusDays(3)));

        StreakService.StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(2, result.current());
        assertEquals(2, result.longest());
    }

    @Test
    void calculateStreaks_ShouldReturnZeroCurrent_WhenLastReadingWasTwoDaysAgo() {
        LocalDate twoDaysAgo = LocalDate.now(ZoneOffset.UTC).minusDays(2);
        when(sessionRepository.findAllDistinctReadingDays(eq(user), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(twoDaysAgo));

        StreakService.StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(0, result.current());
        assertEquals(1, result.longest());
    }

    @Test
    void calculateStreaks_ShouldFindLongestConsecutiveRun() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(sessionRepository.findAllDistinctReadingDays(eq(user), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(
                        today, today.minusDays(1),
                        today.minusDays(5), today.minusDays(6), today.minusDays(7)
                ));

        StreakService.StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(2, result.current());
        assertEquals(3, result.longest());
    }

    @Test
    void calculateStreaks_ShouldReturnOneForBoth_WhenSingleDayToday() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        when(sessionRepository.findAllDistinctReadingDays(eq(user), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(today));

        StreakService.StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(1, result.current());
        assertEquals(1, result.longest());
    }
}
