package com.example.mybooktracker.stats.application;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.application.BookQueryPort;
import com.example.mybooktracker.sessions.application.ReadingSessionQueryPort;
import com.example.mybooktracker.sessions.domain.ReadingSession;
import com.example.mybooktracker.stats.domain.activity.SessionAnalyzer;
import com.example.mybooktracker.stats.domain.achievements.AchievementContext;
import com.example.mybooktracker.stats.domain.streak.StreakInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AchievementContextFactory {

    private final BookQueryPort bookQueryPort;
    private final ReadingSessionQueryPort readingSessionQueryPort;
    private final StreakService streakService;
    private final Clock clock;

    public AchievementContext build(User user, ZoneId zoneId) {
        long totalBooks = bookQueryPort.countByUser(user);
        long completedBooks = bookQueryPort.countCompletedByUser(user);
        long totalPages = readingSessionQueryPort.sumCompletedPagesByUser(user);
        long totalSessions = readingSessionQueryPort.countCompletedByUser(user);
        StreakInfo streakInfo = streakService.calculateStreaks(user, zoneId);
        int bestStreak = streakInfo.longest();

        Instant since = LocalDate.now(clock.withZone(zoneId)).minusYears(1).atStartOfDay(zoneId).toInstant();
        List<ReadingSession> sessions = readingSessionQueryPort.findCompletedSessionsSince(user, since);
        Map<java.time.LocalDate, Integer> dailyPagesMap = SessionAnalyzer.getDailyPagesMap(sessions, zoneId);
        int maxDailyPages = dailyPagesMap.values().stream()
                .mapToInt(Integer::intValue)
                .max()
                .orElse(0);

        return new AchievementContext(
                totalBooks,
                completedBooks,
                totalPages,
                totalSessions,
                maxDailyPages,
                bestStreak,
                zoneId,
                sessions);
    }
}
