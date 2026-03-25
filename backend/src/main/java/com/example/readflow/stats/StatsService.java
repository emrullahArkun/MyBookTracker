package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.sessions.ReadingSession;
import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.SessionStatus;
import com.example.readflow.sessions.StreakService;
import com.example.readflow.stats.dto.DailyActivityDto;
import com.example.readflow.stats.dto.GenreStatDto;
import com.example.readflow.stats.dto.StatsOverviewDto;
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

}
