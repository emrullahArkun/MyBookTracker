package com.example.mybooktracker.books.application;

import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.books.domain.ReadingGoalPeriodCalculator;
import com.example.mybooktracker.books.domain.ReadingGoalType;
import com.example.mybooktracker.sessions.application.ReadingSessionQueryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReadingGoalProgressService {

    private final ReadingSessionQueryPort readingSessionQueryPort;
    private final Clock clock;
    private final ReadingGoalPeriodCalculator readingGoalPeriodCalculator;

    public Integer calculateProgress(Book book) {
        if (!book.getReadingGoal().isSet() || book.getReadingGoal().getPages() == null) {
            return null;
        }

        Instant startInstant = readingGoalPeriodCalculator.getStartOfPeriod(book.getReadingGoal().getType(), clock);
        return readingSessionQueryPort.sumCompletedPagesByBookSince(book, startInstant);
    }

    public Map<Long, Integer> calculateProgressBatch(List<Book> books) {
        Map<Long, Integer> result = new HashMap<>();

        List<Book> weeklyBooks = books.stream()
                .filter(b -> b.getReadingGoal().getType() == ReadingGoalType.WEEKLY && b.getReadingGoal().getPages() != null)
                .toList();

        List<Book> monthlyBooks = books.stream()
                .filter(b -> b.getReadingGoal().getType() == ReadingGoalType.MONTHLY && b.getReadingGoal().getPages() != null)
                .toList();

        if (!weeklyBooks.isEmpty()) {
            Instant weekStart = readingGoalPeriodCalculator.getStartOfPeriod(ReadingGoalType.WEEKLY, clock);
            for (var row : readingSessionQueryPort.sumCompletedPagesByBooksSince(weeklyBooks, weekStart)) {
                result.put(row.bookId(), row.totalPages());
            }
            // Books with goals but no sessions yet get 0
            for (Book book : weeklyBooks) {
                result.putIfAbsent(book.getId(), 0);
            }
        }

        if (!monthlyBooks.isEmpty()) {
            Instant monthStart = readingGoalPeriodCalculator.getStartOfPeriod(ReadingGoalType.MONTHLY, clock);
            for (var row : readingSessionQueryPort.sumCompletedPagesByBooksSince(monthlyBooks, monthStart)) {
                result.put(row.bookId(), row.totalPages());
            }
            for (Book book : monthlyBooks) {
                result.putIfAbsent(book.getId(), 0);
            }
        }

        return result;
    }
}
