package com.example.readflow.sessions;

import com.example.readflow.auth.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final ReadingSessionRepository sessionRepository;

    public record StreakInfo(int current, int longest) {}

    public StreakInfo calculateStreaks(User user) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        List<LocalDate> readingDays = sessionRepository.findAllDistinctReadingDays(
                user, SessionStatus.COMPLETED);

        if (readingDays.isEmpty()) return new StreakInfo(0, 0);

        int current = calculateCurrentStreak(readingDays, today);
        int longest = calculateLongestStreak(readingDays);

        return new StreakInfo(current, Math.max(current, longest));
    }

    private int calculateCurrentStreak(List<LocalDate> readingDays, LocalDate today) {
        LocalDate expected = today;

        // List is sorted DESC — check if today is present via first element
        if (!readingDays.get(0).equals(expected)) {
            expected = expected.minusDays(1);
        }

        int streak = 0;
        for (LocalDate day : readingDays) {
            if (day.equals(expected)) {
                streak++;
                expected = expected.minusDays(1);
            } else if (day.isBefore(expected)) {
                break;
            }
        }

        return streak;
    }

    private int calculateLongestStreak(List<LocalDate> readingDays) {
        // List is sorted DESC — forward iteration: each element should be one day before the previous
        int longest = 1;
        int current = 1;
        for (int i = 1; i < readingDays.size(); i++) {
            if (readingDays.get(i - 1).minusDays(1).equals(readingDays.get(i))) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 1;
            }
        }
        return longest;
    }
}
