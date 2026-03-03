package com.example.minilibrary.sessions;

import com.example.minilibrary.auth.User;
import com.example.minilibrary.sessions.dto.ExcludeTimeRequest;
import com.example.minilibrary.sessions.dto.ReadingSessionDto;
import com.example.minilibrary.sessions.dto.StartSessionRequest;
import com.example.minilibrary.sessions.dto.StopSessionRequest;
import com.example.minilibrary.shared.security.CurrentUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class ReadingSessionController {

    private final ReadingSessionService sessionService;

    @PostMapping("/start")
    public ResponseEntity<ReadingSessionDto> startSession(
            @RequestBody @Valid StartSessionRequest request,
            @CurrentUser User user) {
        ReadingSession session = sessionService.startSession(user, request.bookId());
        return ResponseEntity.ok(mapToDto(session));
    }

    @PostMapping("/stop")
    public ResponseEntity<ReadingSessionDto> stopSession(
            @RequestBody(required = false) @Valid StopSessionRequest request,
            @CurrentUser User user) {
        Instant endTime = null;
        Integer endPage = null;

        if (request != null) {
            endTime = request.endTime();
            endPage = request.endPage();
        }
        ReadingSession session = sessionService.stopSession(user, endTime, endPage);
        return ResponseEntity.ok(mapToDto(session));
    }

    @GetMapping("/active")
    public ResponseEntity<ReadingSessionDto> getActiveSession(@CurrentUser User user) {
        return sessionService.getActiveSession(user)
                .map(this::mapToDto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/active/exclude-time")
    public ResponseEntity<ReadingSessionDto> excludeTime(
            @RequestBody @Valid ExcludeTimeRequest request,
            @CurrentUser User user) {
        ReadingSession session = sessionService.excludeTime(user, request.millis());
        return ResponseEntity.ok(mapToDto(session));
    }

    @PostMapping("/active/pause")
    public ResponseEntity<ReadingSessionDto> pauseSession(@CurrentUser User user) {
        ReadingSession session = sessionService.pauseSession(user);
        return ResponseEntity.ok(mapToDto(session));
    }

    @PostMapping("/active/resume")
    public ResponseEntity<ReadingSessionDto> resumeSession(@CurrentUser User user) {
        ReadingSession session = sessionService.resumeSession(user);
        return ResponseEntity.ok(mapToDto(session));
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<List<ReadingSessionDto>> getSessionsByBook(@PathVariable Long bookId,
            @CurrentUser User user) {
        List<ReadingSessionDto> sessions = sessionService.getSessionsByBook(user, bookId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(sessions);
    }

    private ReadingSessionDto mapToDto(ReadingSession session) {
        return new ReadingSessionDto(
                session.getId(),
                session.getBook().getId(),
                session.getStartTime(),
                session.getEndTime(),
                session.getStatus(),
                session.getEndPage(),
                session.getPausedMillis(),
                session.getPausedAt());
    }
}
