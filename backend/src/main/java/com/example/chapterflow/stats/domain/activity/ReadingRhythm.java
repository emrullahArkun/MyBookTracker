package com.example.chapterflow.stats.domain.activity;

public record ReadingRhythm(
        boolean enoughData,
        ReadingTimeOfDay preferredTimeOfDay,
        ReadingSessionLength preferredSessionLength,
        int activeDaysLast14,
        int sessionsLast14,
        int averagePagesPerSession,
        int averageMinutesPerSession) {

    public ReadingRhythm {
        preferredTimeOfDay = preferredTimeOfDay == null ? ReadingTimeOfDay.UNKNOWN : preferredTimeOfDay;
        preferredSessionLength = preferredSessionLength == null ? ReadingSessionLength.UNKNOWN : preferredSessionLength;
        activeDaysLast14 = Math.max(activeDaysLast14, 0);
        sessionsLast14 = Math.max(sessionsLast14, 0);
        averagePagesPerSession = Math.max(averagePagesPerSession, 0);
        averageMinutesPerSession = Math.max(averageMinutesPerSession, 0);
    }
}
