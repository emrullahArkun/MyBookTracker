package com.example.readflow.books;

import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.SessionStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReadingGoalProgressCalculator {

    private final ReadingSessionRepository sessionRepository;
    private final Clock clock;

    public Integer calculateProgress(Book book) {
        if (book.getReadingGoalType() == null || book.getReadingGoalPages() == null) {
            return null;
        }

        Instant startInstant = getStartOfPeriod(book.getReadingGoalType());
        return sessionRepository.sumPagesReadByBookSince(book, startInstant, SessionStatus.COMPLETED);
    }

    public Map<Long, Integer> calculateProgressBatch(List<Book> books) {
        Map<Long, Integer> result = new HashMap<>();

        List<Book> weeklyBooks = books.stream()
                .filter(b -> b.getReadingGoalType() == ReadingGoalType.WEEKLY && b.getReadingGoalPages() != null)
                .toList();

        List<Book> monthlyBooks = books.stream()
                .filter(b -> b.getReadingGoalType() == ReadingGoalType.MONTHLY && b.getReadingGoalPages() != null)
                .toList();

        if (!weeklyBooks.isEmpty()) {
            Instant weekStart = getStartOfPeriod(ReadingGoalType.WEEKLY);
            for (var row : sessionRepository.sumPagesReadByBooksSince(weeklyBooks, weekStart, SessionStatus.COMPLETED)) {
                result.put(row.getBookId(), row.getTotalPages());
            }
            // Books with goals but no sessions yet get 0
            for (Book book : weeklyBooks) {
                result.putIfAbsent(book.getId(), 0);
            }
        }

        if (!monthlyBooks.isEmpty()) {
            Instant monthStart = getStartOfPeriod(ReadingGoalType.MONTHLY);
            for (var row : sessionRepository.sumPagesReadByBooksSince(monthlyBooks, monthStart, SessionStatus.COMPLETED)) {
                result.put(row.getBookId(), row.getTotalPages());
            }
            for (Book book : monthlyBooks) {
                result.putIfAbsent(book.getId(), 0);
            }
        }

        return result;
    }

    private Instant getStartOfPeriod(ReadingGoalType goalType) {
        LocalDate now = LocalDate.now(clock);
        LocalDateTime startOfPeriod = switch (goalType) {
            case WEEKLY -> now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
            case MONTHLY -> now.withDayOfMonth(1).atStartOfDay();
        };
        return startOfPeriod.atZone(ZoneOffset.UTC).toInstant();
    }
}
