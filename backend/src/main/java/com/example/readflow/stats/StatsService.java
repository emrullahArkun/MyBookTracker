package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.books.Book;
import com.example.readflow.books.BookRepository;
import com.example.readflow.sessions.ReadingSession;
import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.StreakService;
import com.example.readflow.stats.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final BookRepository bookRepository;
    private final ReadingSessionRepository sessionRepository;
    private final StreakService streakService;

    public StatsOverviewDto getOverview(User user) {
        long totalBooks = bookRepository.countByUser(user);
        long completedBooks = bookRepository.countByUserAndCompletedTrue(user);
        long totalPagesRead = sessionRepository.sumPagesReadByUser(user);

        LocalDate since = LocalDate.now(ZoneOffset.UTC).minusYears(1);
        List<ReadingSession> sessions = sessionRepository.findCompletedSessionsSince(user, since);

        long totalReadingMinutes = calculateTotalMinutes(sessions);
        List<DailyActivityDto> dailyActivity = buildDailyActivity(sessions);
        List<GenreStatDto> genreDistribution = buildGenreDistribution(user);

        int currentStreak = streakService.calculateCurrentStreak(user);
        int longestStreak = streakService.calculateLongestStreak(user);

        return new StatsOverviewDto(
                totalBooks, completedBooks, totalPagesRead, totalReadingMinutes,
                currentStreak, longestStreak, genreDistribution, dailyActivity);
    }

    public List<AchievementDto> getAchievements(User user) {
        long totalBooks = bookRepository.countByUser(user);
        long completedBooks = bookRepository.countByUserAndCompletedTrue(user);
        long totalPages = sessionRepository.sumPagesReadByUser(user);
        long totalSessions = sessionRepository.countCompletedByUser(user);
        int currentStreak = streakService.calculateCurrentStreak(user);
        int longestStreak = streakService.calculateLongestStreak(user);

        LocalDate since = LocalDate.now(ZoneOffset.UTC).minusYears(1);
        List<ReadingSession> sessions = sessionRepository.findCompletedSessionsSince(user, since);

        int maxDailyPages = getMaxDailyPages(sessions);
        boolean hasEarlySession = hasSessionInHourRange(sessions, 5, 8);
        boolean hasLateSession = hasSessionInHourRange(sessions, 22, 28); // 22-03 next day
        boolean hasSpeedRead = hasSpeedRead(user);

        List<AchievementDto> achievements = new ArrayList<>();

        achievements.add(new AchievementDto("FIRST_SESSION",
                totalSessions >= 1, totalSessions >= 1 ? totalSessions + " sessions" : null));

        achievements.add(new AchievementDto("BOOKWORM",
                completedBooks >= 5, completedBooks >= 5 ? completedBooks + " books" : completedBooks + "/5"));

        achievements.add(new AchievementDto("LIBRARY_BUILDER",
                totalBooks >= 10, totalBooks >= 10 ? totalBooks + " books" : totalBooks + "/10"));

        achievements.add(new AchievementDto("PAGE_TURNER",
                totalPages >= 1000, totalPages >= 1000 ? totalPages + " pages" : totalPages + "/1000"));

        achievements.add(new AchievementDto("MARATHON",
                maxDailyPages >= 100, maxDailyPages >= 100 ? maxDailyPages + " pages" : maxDailyPages + "/100"));

        achievements.add(new AchievementDto("EARLY_BIRD",
                hasEarlySession, null));

        achievements.add(new AchievementDto("NIGHT_OWL",
                hasLateSession, null));

        int bestStreak = Math.max(currentStreak, longestStreak);
        achievements.add(new AchievementDto("WEEK_STREAK",
                bestStreak >= 7, bestStreak >= 7 ? bestStreak + " days" : bestStreak + "/7"));

        achievements.add(new AchievementDto("MONTH_STREAK",
                bestStreak >= 30, bestStreak >= 30 ? bestStreak + " days" : bestStreak + "/30"));

        achievements.add(new AchievementDto("SPEED_READER",
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

    private List<DailyActivityDto> buildDailyActivity(List<ReadingSession> sessions) {
        Map<LocalDate, Integer> dayMap = new TreeMap<>();
        for (ReadingSession s : sessions) {
            if (s.getEndTime() != null && s.getPagesRead() != null && s.getPagesRead() > 0) {
                LocalDate day = s.getEndTime().atZone(ZoneOffset.UTC).toLocalDate();
                dayMap.merge(day, s.getPagesRead(), Integer::sum);
            }
        }
        return dayMap.entrySet().stream()
                .map(e -> new DailyActivityDto(e.getKey(), e.getValue()))
                .toList();
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

    private int getMaxDailyPages(List<ReadingSession> sessions) {
        Map<LocalDate, Integer> dayMap = new HashMap<>();
        for (ReadingSession s : sessions) {
            if (s.getEndTime() != null && s.getPagesRead() != null && s.getPagesRead() > 0) {
                LocalDate day = s.getEndTime().atZone(ZoneOffset.UTC).toLocalDate();
                dayMap.merge(day, s.getPagesRead(), Integer::sum);
            }
        }
        return dayMap.values().stream().mapToInt(Integer::intValue).max().orElse(0);
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

    private boolean hasSpeedRead(User user) {
        List<Book> books = bookRepository.findByUser(user);
        for (Book b : books) {
            if (Boolean.TRUE.equals(b.getCompleted()) && b.getStartDate() != null) {
                long days = Duration.between(
                        b.getStartDate().atStartOfDay(),
                        LocalDate.now(ZoneOffset.UTC).atStartOfDay()).toDays();
                if (days <= 7) return true;
            }
        }
        return false;
    }
}
