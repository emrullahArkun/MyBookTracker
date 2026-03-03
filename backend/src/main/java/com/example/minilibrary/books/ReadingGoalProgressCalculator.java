package com.example.minilibrary.books;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;

@Service
public class ReadingGoalProgressCalculator {

    public Integer calculateProgress(Book book) {
        if (book.getReadingGoalType() == null || book.getReadingGoalPages() == null) {
            return null;
        }

        LocalDate now = LocalDate.now();
        LocalDateTime startOfPeriod;

        if (ReadingGoalType.WEEKLY == book.getReadingGoalType()) {
            LocalDate monday = now.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            startOfPeriod = monday.atStartOfDay();
        } else {
            startOfPeriod = now.withDayOfMonth(1).atStartOfDay();
        }

        ZoneId zone = ZoneId.systemDefault();
        Instant startInstant = startOfPeriod.atZone(zone).toInstant();

        if (book.getReadingSessions() == null) {
            return 0;
        }

        return book.getReadingSessions().stream()
                .filter(s -> s.getEndTime() != null && s.getEndTime().isAfter(startInstant))
                .mapToInt(s -> {
                    if (s.getPagesRead() != null) {
                        return s.getPagesRead();
                    }
                    if (s.getEndPage() != null && s.getEndPage() > 0) {
                        return 0;
                    }
                    return 0;
                })
                .sum();
    }
}
