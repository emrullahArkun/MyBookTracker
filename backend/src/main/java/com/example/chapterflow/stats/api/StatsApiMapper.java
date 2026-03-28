package com.example.chapterflow.stats.api;

import com.example.chapterflow.stats.api.dto.AchievementDto;
import com.example.chapterflow.stats.api.dto.DailyActivityDto;
import com.example.chapterflow.stats.api.dto.GenreStatDto;
import com.example.chapterflow.stats.api.dto.ReadingRhythmDto;
import com.example.chapterflow.stats.api.dto.StatsOverviewDto;
import com.example.chapterflow.stats.application.DailyActivity;
import com.example.chapterflow.stats.application.GenreStat;
import com.example.chapterflow.stats.application.StatsOverview;
import com.example.chapterflow.stats.domain.achievements.Achievement;
import com.example.chapterflow.stats.domain.activity.ReadingRhythm;

import java.util.List;

final class StatsApiMapper {

    private StatsApiMapper() {
    }

    static StatsOverviewDto toDto(StatsOverview overview) {
        return new StatsOverviewDto(
                overview.totalBooks(),
                overview.completedBooks(),
                overview.totalPagesRead(),
                overview.totalReadingMinutes(),
                overview.currentStreak(),
                overview.longestStreak(),
                toGenreStatDtos(overview.genreDistribution()),
                toDailyActivityDtos(overview.dailyActivity()),
                toReadingRhythmDto(overview.readingRhythm()));
    }

    static AchievementDto toDto(Achievement achievement) {
        return new AchievementDto(
                achievement.id(),
                achievement.unlocked(),
                achievement.unlockedDetail());
    }

    static List<AchievementDto> toAchievementDtos(List<Achievement> achievements) {
        return achievements.stream()
                .map(StatsApiMapper::toDto)
                .toList();
    }

    private static List<GenreStatDto> toGenreStatDtos(List<GenreStat> genreStats) {
        return genreStats.stream()
                .map(genreStat -> new GenreStatDto(genreStat.genre(), genreStat.count()))
                .toList();
    }

    private static List<DailyActivityDto> toDailyActivityDtos(List<DailyActivity> dailyActivities) {
        return dailyActivities.stream()
                .map(dailyActivity -> new DailyActivityDto(dailyActivity.date(), dailyActivity.pagesRead()))
                .toList();
    }

    private static ReadingRhythmDto toReadingRhythmDto(ReadingRhythm readingRhythm) {
        if (readingRhythm == null) {
            return null;
        }

        return new ReadingRhythmDto(
                readingRhythm.enoughData(),
                readingRhythm.preferredTimeOfDay().name(),
                readingRhythm.preferredSessionLength().name(),
                readingRhythm.activeDaysLast14(),
                readingRhythm.sessionsLast14(),
                readingRhythm.averagePagesPerSession(),
                readingRhythm.averageMinutesPerSession());
    }
}
