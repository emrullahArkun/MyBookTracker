package com.example.chapterflow.stats.domain.activity;

import com.example.chapterflow.auth.domain.User;
import com.example.chapterflow.sessions.domain.ReadingSession;
import com.example.chapterflow.sessions.domain.SessionStatus;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ReadingRhythmAnalyzerTest {

    @Test
    void analyze_ShouldReturnEmptyRhythm_WhenThereAreNoSessions() {
        ReadingRhythm rhythm = ReadingRhythmAnalyzer.analyze(List.of(), Clock.systemUTC(), ZoneOffset.UTC);

        assertFalse(rhythm.enoughData());
        assertEquals(0, rhythm.sessionsLast14());
        assertEquals(ReadingTimeOfDay.UNKNOWN, rhythm.preferredTimeOfDay());
        assertEquals(ReadingSessionLength.UNKNOWN, rhythm.preferredSessionLength());
    }

    @Test
    void analyze_ShouldRespectTimezoneBuckets() {
        Clock clock = Clock.fixed(Instant.parse("2026-03-28T10:00:00Z"), ZoneOffset.UTC);
        List<ReadingSession> sessions = List.of(
                buildSession(LocalDate.of(2026, 3, 18), 20, 18, 60),
                buildSession(LocalDate.of(2026, 3, 21), 18, 18, 60),
                buildSession(LocalDate.of(2026, 3, 24), 22, 18, 60),
                buildSession(LocalDate.of(2026, 3, 27), 24, 18, 60));

        ReadingRhythm rhythm = ReadingRhythmAnalyzer.analyze(sessions, clock, ZoneId.of("Europe/Berlin"));

        assertTrue(rhythm.enoughData());
        assertEquals(ReadingTimeOfDay.EVENING, rhythm.preferredTimeOfDay());
        assertEquals(ReadingSessionLength.LONG, rhythm.preferredSessionLength());
        assertEquals(21, rhythm.averagePagesPerSession());
        assertEquals(60, rhythm.averageMinutesPerSession());
    }

    @Test
    void analyze_ShouldIgnoreOldAndInvalidDurations() {
        Clock clock = Clock.fixed(Instant.parse("2026-03-28T10:00:00Z"), ZoneOffset.UTC);
        ReadingSession oldSession = buildSession(LocalDate.of(2026, 3, 1), 50, 8, 60);
        ReadingSession invalidDuration = buildSession(LocalDate.of(2026, 3, 27), 10, 8, 10);
        invalidDuration.setPausedMillis(60L * 60L * 1000L);

        ReadingRhythm rhythm = ReadingRhythmAnalyzer.analyze(List.of(oldSession, invalidDuration), clock, ZoneOffset.UTC);

        assertFalse(rhythm.enoughData());
        assertEquals(1, rhythm.sessionsLast14());
        assertEquals(0, rhythm.averageMinutesPerSession());
        assertEquals(10, rhythm.averagePagesPerSession());
    }

    private ReadingSession buildSession(LocalDate date, int pagesRead, int startHour, int durationMinutes) {
        User user = new User();
        user.setId(1L);

        ReadingSession session = new ReadingSession();
        session.setUser(user);
        session.setStatus(SessionStatus.COMPLETED);
        Instant start = date.atTime(startHour, 0).atZone(ZoneOffset.UTC).toInstant();
        session.setStartTime(start);
        session.setEndTime(start.plusSeconds(durationMinutes * 60L));
        session.setPagesRead(pagesRead);
        session.setPausedMillis(0L);
        return session;
    }
}
