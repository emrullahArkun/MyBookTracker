package com.example.chapterflow.stats.api.dto;

import java.util.List;

public record StatsOverviewDto(
        long totalBooks,
        long completedBooks,
        long totalPagesRead,
        long totalReadingMinutes,
        int currentStreak,
        int longestStreak,
        List<GenreStatDto> genreDistribution,
        List<DailyActivityDto> dailyActivity,
        ReadingRhythmDto readingRhythm) {

    public StatsOverviewDto {
        genreDistribution = genreDistribution == null ? List.of() : List.copyOf(genreDistribution);
        dailyActivity = dailyActivity == null ? List.of() : List.copyOf(dailyActivity);
    }
}
