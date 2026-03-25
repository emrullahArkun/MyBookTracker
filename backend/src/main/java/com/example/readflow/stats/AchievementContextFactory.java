package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.sessions.ReadingSession;
import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.SessionStatus;
import com.example.readflow.sessions.StreakService;
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
class AchievementContextFactory {

    private final BookRepository bookRepository;
    private final ReadingSessionRepository sessionRepository;
    private final StreakService streakService;
    private final Clock clock;

    AchievementContext build(User user, ZoneId zoneId) {
        long totalBooks = bookRepository.countByUser(user);
        long completedBooks = bookRepository.countByUserAndCompletedTrue(user);
        long totalPages = sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED);
        long totalSessions = sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED);
        int bestStreak = streakService.calculateStreaks(user, zoneId).longest();

        Instant since = LocalDate.now(clock.withZone(zoneId)).minusYears(1).atStartOfDay(zoneId).toInstant();
        List<ReadingSession> sessions = sessionRepository.findCompletedSessionsSince(user, since, SessionStatus.COMPLETED);
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
