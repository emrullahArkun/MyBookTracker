package com.example.minilibrary.sessions.dto;

import com.example.minilibrary.sessions.SessionStatus;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.Instant;

public record ReadingSessionDto(
                Long id,
                Long bookId,
                @JsonFormat(shape = JsonFormat.Shape.STRING) Instant startTime,
                @JsonFormat(shape = JsonFormat.Shape.STRING) Instant endTime,
                SessionStatus status,
                Integer endPage,
                Long pausedMillis,
                @JsonFormat(shape = JsonFormat.Shape.STRING) Instant pausedAt) {
}
