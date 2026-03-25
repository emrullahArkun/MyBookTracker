package com.example.readflow.sessions.dto;

import com.example.readflow.sessions.SessionStatus;

import java.time.Instant;

public record ReadingSessionDto(
                Long id,
                Long bookId,
                Instant startTime,
                Instant endTime,
                SessionStatus status,
                Integer startPage,
                Integer endPage,
                Integer pagesRead,
                Long pausedMillis,
                Instant pausedAt) {
}
