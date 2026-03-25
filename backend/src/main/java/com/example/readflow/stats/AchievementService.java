package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.sessions.ReadingSession;
import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.SessionStatus;
import com.example.readflow.sessions.StreakService;
import com.example.readflow.stats.dto.AchievementDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final BookRepository bookRepository;
    private final ReadingSessionRepository sessionRepository;
    private final StreakService streakService;

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
        boolean hasSpeedRead = false;
        for (ReadingSession s : sessions) {
            com.example.readflow.books.Book b = s.getBook();
            if (b != null && Boolean.TRUE.equals(b.getCompleted()) && b.getStartDate() != null && b.getPageCount() != null && b.getPageCount() > 0 && s.getEndTime() != null) {
                LocalDate completedDay = s.getEndTime().atZone(ZoneOffset.UTC).toLocalDate();
                long days = java.time.temporal.ChronoUnit.DAYS.between(b.getStartDate(), completedDay);
                days = Math.max(1, days);
                if ((double) b.getPageCount() / days >= 50.0) {
                    hasSpeedRead = true;
                    break;
                }
            }
        }

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
