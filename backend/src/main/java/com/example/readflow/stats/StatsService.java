package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.sessions.ReadingSession;
import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.SessionStatus;
import com.example.readflow.sessions.StreakService;
import com.example.readflow.stats.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final BookRepository bookRepository;
    private final ReadingSessionRepository sessionRepository;
    private final StreakService streakService;

    public StatsOverviewDto getOverview(User user) {
        long totalBooks = bookRepository.countByUser(user);
        long completedBooks = bookRepository.countByUserAndCompletedTrue(user);
        long totalPagesRead = sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED);

        LocalDate since = LocalDate.now(ZoneOffset.UTC).minusYears(1);
        List<ReadingSession> sessions = sessionRepository.findCompletedSessionsSince(user, since, SessionStatus.COMPLETED);

        long totalReadingMinutes = calculateTotalMinutes(sessions);
        Map<LocalDate, Integer> dailyPagesMap = getDailyPagesMap(sessions);
        List<DailyActivityDto> dailyActivity = dailyPagesMap.entrySet().stream()
                .map(e -> new DailyActivityDto(e.getKey(), e.getValue()))
                .toList();
        List<GenreStatDto> genreDistribution = buildGenreDistribution(user);

        StreakService.StreakInfo streakInfo = streakService.calculateStreaks(user);

        return new StatsOverviewDto(
                totalBooks, completedBooks, totalPagesRead, totalReadingMinutes,
                streakInfo.current(), streakInfo.longest(), genreDistribution, dailyActivity);
    }

    public List<AchievementDto> getAchievements(User user) {
        long totalBooks = bookRepository.countByUser(user);
        long completedBooks = bookRepository.countByUserAndCompletedTrue(user);
        long totalPages = sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED);
        long totalSessions = sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED);
        StreakService.StreakInfo streakInfo = streakService.calculateStreaks(user);

        LocalDate since = LocalDate.now(ZoneOffset.UTC).minusYears(1);
        List<ReadingSession> sessions = sessionRepository.findCompletedSessionsSince(user, since, SessionStatus.COMPLETED);

        Map<LocalDate, Integer> dailyPagesMap = getDailyPagesMap(sessions);
        int maxDailyPages = dailyPagesMap.values().stream().mapToInt(Integer::intValue).max().orElse(0);
        boolean hasEarlySession = hasSessionInHourRange(sessions, 5, 8);
        boolean hasLateSession = hasSessionInHourRange(sessions, 22, 28); // 22-03 next day
        boolean hasSpeedRead = bookRepository.existsSpeedReadBook(user, LocalDate.now(ZoneOffset.UTC).minusDays(7));

        List<AchievementDto> achievements = new ArrayList<>();

        achievements.add(new AchievementDto(AchievementType.FIRST_SESSION,
                totalSessions >= 1, totalSessions >= 1 ? totalSessions + " sessions" : null));

        achievements.add(new AchievementDto(AchievementType.BOOKWORM,
                completedBooks >= 5, completedBooks >= 5 ? completedBooks + " books" : completedBooks + "/5"));

        achievements.add(new AchievementDto(AchievementType.LIBRARY_BUILDER,
                totalBooks >= 10, totalBooks >= 10 ? totalBooks + " books" : totalBooks + "/10"));

        achievements.add(new AchievementDto(AchievementType.PAGE_TURNER,
                totalPages >= 1000, totalPages >= 1000 ? totalPages + " pages" : totalPages + "/1000"));

        achievements.add(new AchievementDto(AchievementType.MARATHON,
                maxDailyPages >= 100, maxDailyPages >= 100 ? maxDailyPages + " pages" : maxDailyPages + "/100"));

        achievements.add(new AchievementDto(AchievementType.EARLY_BIRD,
                hasEarlySession, null));

        achievements.add(new AchievementDto(AchievementType.NIGHT_OWL,
                hasLateSession, null));

        int bestStreak = streakInfo.longest();
        achievements.add(new AchievementDto(AchievementType.WEEK_STREAK,
                bestStreak >= 7, bestStreak >= 7 ? bestStreak + " days" : bestStreak + "/7"));

        achievements.add(new AchievementDto(AchievementType.MONTH_STREAK,
                bestStreak >= 30, bestStreak >= 30 ? bestStreak + " days" : bestStreak + "/30"));

        achievements.add(new AchievementDto(AchievementType.SPEED_READER,
                hasSpeedRead, null));

        return achievements;
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

    private Map<LocalDate, Integer> getDailyPagesMap(List<ReadingSession> sessions) {
        Map<LocalDate, Integer> dayMap = new TreeMap<>();
        for (ReadingSession s : sessions) {
            if (s.getEndTime() != null && s.getPagesRead() != null && s.getPagesRead() > 0) {
                LocalDate day = s.getEndTime().atZone(ZoneOffset.UTC).toLocalDate();
                dayMap.merge(day, s.getPagesRead(), Integer::sum);
            }
        }
        return dayMap;
    }

    private List<GenreStatDto> buildGenreDistribution(User user) {
        List<String> categories = bookRepository.findAllCategoriesByUser(user);
        Map<String, Integer> counts = new HashMap<>();
        for (String cat : categories) {
            if (cat != null && !cat.isEmpty()) {
                counts.merge(cat, 1, Integer::sum);
            }
        }
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(8)
                .map(e -> new GenreStatDto(e.getKey(), e.getValue()))
                .toList();
    }

    private boolean hasSessionInHourRange(List<ReadingSession> sessions, int fromHour, int toHour) {
        for (ReadingSession s : sessions) {
            if (s.getStartTime() == null) continue;
            int hour = s.getStartTime().atZone(ZoneOffset.UTC).getHour();
            if (toHour > 24) {
                // Wraps past midnight (e.g. 22-03)
                if (hour >= fromHour || hour < (toHour - 24)) return true;
            } else {
                if (hour >= fromHour && hour < toHour) return true;
            }
        }
        return false;
    }

}
