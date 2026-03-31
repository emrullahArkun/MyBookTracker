package com.example.mybooktracker.stats.application;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.application.BookQueryPort;
import com.example.mybooktracker.sessions.application.ReadingSessionQueryPort;
import com.example.mybooktracker.sessions.domain.ReadingSession;
import com.example.mybooktracker.shared.time.ZoneIdResolver;
import com.example.mybooktracker.stats.domain.activity.ReadingRhythm;
import com.example.mybooktracker.stats.domain.activity.ReadingRhythmAnalyzer;
import com.example.mybooktracker.stats.domain.activity.SessionAnalyzer;
import com.example.mybooktracker.stats.domain.streak.StreakInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatsService {

    private final BookQueryPort bookQueryPort;
    private final ReadingSessionQueryPort readingSessionQueryPort;
    private final StreakService streakService;
    private final Clock clock;

    public StatsOverview getOverview(User user) {
        return getOverview(user, null);
    }

    public StatsOverview getOverview(User user, String timezone) {
        ZoneId zoneId = ZoneIdResolver.resolveOrUtc(timezone);
        long totalBooks = bookQueryPort.countByUser(user);
        long completedBooks = bookQueryPort.countCompletedByUser(user);
        long totalPagesRead = readingSessionQueryPort.sumCompletedPagesByUser(user);

        Instant since = LocalDate.now(clock.withZone(zoneId)).minusYears(1).atStartOfDay(zoneId).toInstant();
        List<ReadingSession> sessions = readingSessionQueryPort.findCompletedSessionsSince(user, since);

        long totalReadingMinutes = calculateTotalMinutes(sessions);
        Map<LocalDate, Integer> dailyPagesMap = SessionAnalyzer.getDailyPagesMap(sessions, zoneId);
        List<DailyActivity> dailyActivity = dailyPagesMap.entrySet().stream()
                .map(e -> new DailyActivity(e.getKey(), e.getValue()))
                .toList();
        List<GenreStat> genreDistribution = buildGenreDistribution(user);
        ReadingRhythm readingRhythm = ReadingRhythmAnalyzer.analyze(sessions, clock, zoneId);

        StreakInfo streakInfo = streakService.calculateStreaks(user, zoneId);

        return new StatsOverview(
                totalBooks, completedBooks, totalPagesRead, totalReadingMinutes,
                streakInfo.current(), streakInfo.longest(), genreDistribution, dailyActivity, readingRhythm);
    }

    private long calculateTotalMinutes(List<ReadingSession> sessions) {
        long totalMs = 0;
        for (ReadingSession s : sessions) {
            if (s.getStartTime() != null && s.getEndTime() != null) {
                long durationMs = Duration.between(s.getStartTime(), s.getEndTime()).toMillis();
                durationMs -= s.getPausedMillisOrZero();
                if (durationMs > 0) {
                    totalMs += durationMs;
                }
            }
        }
        return totalMs / 60_000;
    }

    private List<GenreStat> buildGenreDistribution(User user) {
        List<String> categories = bookQueryPort.findAllCategoriesByUser(user);
        Map<String, Integer> counts = new HashMap<>();
        for (String cat : categories) {
            if (cat != null && !cat.isEmpty()) {
                counts.merge(cat, 1, Integer::sum);
            }
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(8)
                .map(e -> new GenreStat(e.getKey(), e.getValue()))
                .toList();
    }

}
