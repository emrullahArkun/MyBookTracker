package com.example.mybooktracker.stats.application;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.sessions.application.ReadingSessionQueryPort;
import com.example.mybooktracker.shared.time.ZoneIdResolver;
import com.example.mybooktracker.stats.domain.streak.StreakCalculator;
import com.example.mybooktracker.stats.domain.streak.StreakInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StreakService {

    private final ReadingSessionQueryPort readingSessionQueryPort;
    private final StreakCalculator streakCalculator;
    private final Clock clock;

    public StreakInfo calculateStreaks(User user) {
        return calculateStreaks(user, ZoneIdResolver.resolveOrUtc(null));
    }

    public StreakInfo calculateStreaks(User user, String timezone) {
        return calculateStreaks(user, ZoneIdResolver.resolveOrUtc(timezone));
    }

    public StreakInfo calculateStreaks(User user, ZoneId zoneId) {
        LocalDate today = LocalDate.now(clock.withZone(zoneId));

        List<LocalDate> readingDays = readingSessionQueryPort
                .findCompletedEndTimes(user)
                .stream()
                .map(instant -> instant.atZone(zoneId).toLocalDate())
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        return streakCalculator.calculate(readingDays, today);
    }
}
