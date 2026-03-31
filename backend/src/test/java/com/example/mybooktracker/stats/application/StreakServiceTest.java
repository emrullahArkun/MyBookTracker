package com.example.mybooktracker.stats.application;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.sessions.application.ReadingSessionQueryPort;
import com.example.mybooktracker.stats.domain.streak.StreakCalculator;
import com.example.mybooktracker.stats.domain.streak.StreakInfo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StreakServiceTest {

    private static final LocalDate FIXED_DATE = LocalDate.of(2026, 3, 25);
    private static final Instant FIXED_INSTANT = FIXED_DATE.atStartOfDay(ZoneOffset.UTC).plusHours(12).toInstant();
    private static final Clock FIXED_CLOCK = Clock.fixed(FIXED_INSTANT, ZoneOffset.UTC);

    @Mock
    private ReadingSessionQueryPort readingSessionQueryPort;

    private StreakService streakService;

    private User user;

    @BeforeEach
    void setUp() {
        streakService = new StreakService(readingSessionQueryPort, new StreakCalculator(), FIXED_CLOCK);
        user = new User();
        user.setId(1L);
    }

    @Test
    void calculateStreaks_ShouldReturnZeros_WhenNoReadingDays() {
        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(Collections.emptyList());

        StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(0, result.current());
        assertEquals(0, result.longest());
    }

    @Test
    void calculateStreaks_ShouldCountConsecutiveDays_IncludingToday() {
        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(List.of(
                        FIXED_DATE.atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant(),
                        FIXED_DATE.minusDays(1).atStartOfDay(ZoneOffset.UTC).plusHours(14).toInstant(),
                        FIXED_DATE.minusDays(2).atStartOfDay(ZoneOffset.UTC).plusHours(8).toInstant()
                ));

        StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(3, result.current());
        assertEquals(3, result.longest());
    }

    @Test
    void calculateStreaks_ShouldCountFromYesterday_WhenNoSessionToday() {
        LocalDate yesterday = FIXED_DATE.minusDays(1);
        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(List.of(
                        yesterday.atStartOfDay(ZoneOffset.UTC).plusHours(20).toInstant(),
                        yesterday.minusDays(1).atStartOfDay(ZoneOffset.UTC).plusHours(15).toInstant()
                ));

        StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(2, result.current());
        assertEquals(2, result.longest());
    }

    @Test
    void calculateStreaks_ShouldBreakCurrentOnGap() {
        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(List.of(
                        FIXED_DATE.atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant(),
                        FIXED_DATE.minusDays(1).atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant(),
                        FIXED_DATE.minusDays(3).atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant()
                ));

        StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(2, result.current());
        assertEquals(2, result.longest());
    }

    @Test
    void calculateStreaks_ShouldReturnZeroCurrent_WhenLastReadingWasTwoDaysAgo() {
        LocalDate twoDaysAgo = FIXED_DATE.minusDays(2);
        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(List.of(
                        twoDaysAgo.atStartOfDay(ZoneOffset.UTC).plusHours(12).toInstant()
                ));

        StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(0, result.current());
        assertEquals(1, result.longest());
    }

    @Test
    void calculateStreaks_ShouldFindLongestConsecutiveRun() {
        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(List.of(
                        FIXED_DATE.atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant(),
                        FIXED_DATE.minusDays(1).atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant(),
                        FIXED_DATE.minusDays(5).atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant(),
                        FIXED_DATE.minusDays(6).atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant(),
                        FIXED_DATE.minusDays(7).atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant()
                ));

        StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(2, result.current());
        assertEquals(3, result.longest());
    }

    @Test
    void calculateStreaks_ShouldReturnOneForBoth_WhenSingleDayToday() {
        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(List.of(
                        FIXED_DATE.atStartOfDay(ZoneOffset.UTC).plusHours(18).toInstant()
                ));

        StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(1, result.current());
        assertEquals(1, result.longest());
    }

    @Test
    void calculateStreaks_ShouldRespectUserTimezone() {
        // Fixed clock at 2026-03-25 12:00 UTC
        // In Europe/Berlin (UTC+1 in March) that's 13:00 local time
        ZoneId berlin = ZoneId.of("Europe/Berlin");
        LocalDate todayBerlin = FIXED_DATE; // same calendar day at noon

        // Two sessions on consecutive Berlin dates
        Instant lateEvening = todayBerlin.minusDays(1).atStartOfDay(berlin).plusHours(23).plusMinutes(30)
                .toInstant();
        Instant earlyMorning = todayBerlin.atStartOfDay(berlin).plusHours(1).plusMinutes(30)
                .toInstant();

        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(List.of(lateEvening, earlyMorning));

        StreakInfo berlinResult = streakService.calculateStreaks(user, berlin);
        assertEquals(2, berlinResult.current());
    }

    @Test
    void calculateStreaks_ShouldDeduplicateMultipleSessionsSameDay() {
        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(List.of(
                        FIXED_DATE.atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant(),
                        FIXED_DATE.atStartOfDay(ZoneOffset.UTC).plusHours(14).toInstant(),
                        FIXED_DATE.atStartOfDay(ZoneOffset.UTC).plusHours(20).toInstant()
                ));

        StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(1, result.current());
        assertEquals(1, result.longest());
    }

    @Test
    void calculateStreaks_ShouldFallbackToUtc_WhenNoTimezoneProvided() {
        when(readingSessionQueryPort.findCompletedEndTimes(eq(user)))
                .thenReturn(List.of(
                        FIXED_DATE.atStartOfDay(ZoneOffset.UTC).plusHours(10).toInstant()
                ));

        StreakInfo result = streakService.calculateStreaks(user);
        assertEquals(1, result.current());
        assertEquals(1, result.longest());
    }
}
