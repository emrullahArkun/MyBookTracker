package com.example.readflow.stats;

import com.example.readflow.sessions.ReadingSession;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

final class SessionAnalyzer {

    private SessionAnalyzer() {}

    static Map<LocalDate, Integer> getDailyPagesMap(List<ReadingSession> sessions) {
        return getDailyPagesMap(sessions, ZoneOffset.UTC);
    }

    static Map<LocalDate, Integer> getDailyPagesMap(List<ReadingSession> sessions, ZoneId zoneId) {
        Map<LocalDate, Integer> dayMap = new TreeMap<>();
        for (ReadingSession s : sessions) {
            if (s.getEndTime() != null && s.getPagesRead() != null && s.getPagesRead() > 0) {
                LocalDate day = s.getEndTime().atZone(zoneId).toLocalDate();
                dayMap.merge(day, s.getPagesRead(), Integer::sum);
            }
        }
        return dayMap;
    }
}
