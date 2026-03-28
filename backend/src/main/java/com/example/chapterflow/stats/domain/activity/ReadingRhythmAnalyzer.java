package com.example.chapterflow.stats.domain.activity;

import com.example.chapterflow.sessions.domain.ReadingSession;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class ReadingRhythmAnalyzer {

    private static final int MIN_SESSIONS_FOR_PATTERN = 4;
    private static final int SHORT_SESSION_MINUTES = 20;
    private static final int MEDIUM_SESSION_MINUTES = 45;

    private ReadingRhythmAnalyzer() {
    }

    public static ReadingRhythm analyze(List<ReadingSession> sessions, Clock clock, ZoneId zoneId) {
        if (sessions == null || sessions.isEmpty()) {
            return emptyRhythm();
        }

        Instant since = LocalDate.now(clock.withZone(zoneId))
                .minusDays(13)
                .atStartOfDay(zoneId)
                .toInstant();

        List<ReadingSession> recentSessions = sessions.stream()
                .filter(session -> session.getEndTime() != null && !session.getEndTime().isBefore(since))
                .toList();

        if (recentSessions.isEmpty()) {
            return emptyRhythm();
        }

        Map<ReadingTimeOfDay, Integer> timeOfDayCounts = new EnumMap<>(ReadingTimeOfDay.class);
        Map<ReadingSessionLength, Integer> sessionLengthCounts = new EnumMap<>(ReadingSessionLength.class);
        Set<LocalDate> activeDays = new HashSet<>();

        long totalPages = 0;
        int pageSamples = 0;
        long totalMinutes = 0;
        int minuteSamples = 0;

        for (ReadingSession session : recentSessions) {
            activeDays.add(session.getEndTime().atZone(zoneId).toLocalDate());

            Instant anchorTime = session.getStartTime() != null ? session.getStartTime() : session.getEndTime();
            ReadingTimeOfDay timeOfDay = toTimeOfDay(anchorTime.atZone(zoneId));
            timeOfDayCounts.merge(timeOfDay, 1, Integer::sum);

            long effectiveMinutes = getEffectiveMinutes(session);
            if (effectiveMinutes > 0) {
                ReadingSessionLength sessionLength = toSessionLength(effectiveMinutes);
                sessionLengthCounts.merge(sessionLength, 1, Integer::sum);
                totalMinutes += effectiveMinutes;
                minuteSamples++;
            }

            Integer pagesRead = session.getPagesRead();
            if (pagesRead != null && pagesRead > 0) {
                totalPages += pagesRead;
                pageSamples++;
            }
        }

        return new ReadingRhythm(
                recentSessions.size() >= MIN_SESSIONS_FOR_PATTERN,
                mostFrequent(timeOfDayCounts, ReadingTimeOfDay.UNKNOWN),
                mostFrequent(sessionLengthCounts, ReadingSessionLength.UNKNOWN),
                activeDays.size(),
                recentSessions.size(),
                pageSamples == 0 ? 0 : Math.toIntExact(Math.round((double) totalPages / pageSamples)),
                minuteSamples == 0 ? 0 : Math.toIntExact(Math.round((double) totalMinutes / minuteSamples)));
    }

    private static ReadingRhythm emptyRhythm() {
        return new ReadingRhythm(false, ReadingTimeOfDay.UNKNOWN, ReadingSessionLength.UNKNOWN, 0, 0, 0, 0);
    }

    private static long getEffectiveMinutes(ReadingSession session) {
        if (session.getStartTime() == null || session.getEndTime() == null) {
            return 0;
        }

        long durationMillis = Duration.between(session.getStartTime(), session.getEndTime()).toMillis();
        durationMillis -= session.getPausedMillisOrZero();
        if (durationMillis <= 0) {
            return 0;
        }
        return Math.round(durationMillis / 60_000d);
    }

    private static ReadingTimeOfDay toTimeOfDay(ZonedDateTime dateTime) {
        int hour = dateTime.getHour();
        if (hour >= 5 && hour < 12) {
            return ReadingTimeOfDay.MORNING;
        }
        if (hour >= 12 && hour < 17) {
            return ReadingTimeOfDay.AFTERNOON;
        }
        if (hour >= 17 && hour < 21) {
            return ReadingTimeOfDay.EVENING;
        }
        return ReadingTimeOfDay.NIGHT;
    }

    private static ReadingSessionLength toSessionLength(long effectiveMinutes) {
        if (effectiveMinutes < SHORT_SESSION_MINUTES) {
            return ReadingSessionLength.SHORT;
        }
        if (effectiveMinutes < MEDIUM_SESSION_MINUTES) {
            return ReadingSessionLength.MEDIUM;
        }
        return ReadingSessionLength.LONG;
    }

    private static <T> T mostFrequent(Map<T, Integer> counts, T fallback) {
        return counts.entrySet().stream()
                .max(Map.Entry.<T, Integer>comparingByValue()
                        .thenComparing(entry -> entry.getKey().toString()))
                .map(Map.Entry::getKey)
                .orElse(fallback);
    }
}
