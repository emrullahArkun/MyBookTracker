package com.example.chapterflow.stats.api.dto;

public record ReadingRhythmDto(
        boolean enoughData,
        String preferredTimeOfDay,
        String preferredSessionLength,
        int activeDaysLast14,
        int sessionsLast14,
        int averagePagesPerSession,
        int averageMinutesPerSession) {
}
