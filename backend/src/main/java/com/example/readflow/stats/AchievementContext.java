package com.example.readflow.stats;

import com.example.readflow.sessions.ReadingSession;

import java.time.ZoneId;
import java.util.List;

record AchievementContext(
        long totalBooks,
        long completedBooks,
        long totalPages,
        long totalSessions,
        int maxDailyPages,
        int bestStreak,
        ZoneId zoneId,
        List<ReadingSession> sessions
) {}
