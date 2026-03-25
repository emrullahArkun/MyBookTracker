package com.example.readflow.sessions;

import com.example.readflow.sessions.dto.ExcludeTimeRequest;
import com.example.readflow.sessions.dto.ReadingSessionDto;
import com.example.readflow.sessions.dto.StartSessionRequest;
import com.example.readflow.sessions.dto.StopSessionRequest;
import com.example.readflow.books.Book;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ReadingSessionControllerTest {

    @Mock
    private ReadingSessionService sessionService;

    @Mock
    private StreakService streakService;

    @Mock
    private ReadingSessionMapper sessionMapper;

    @InjectMocks
    private ReadingSessionController sessionController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private ReadingSession session;
    private ReadingSessionDto sessionDto;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(sessionController).build();
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        Book book = new Book();
        book.setId(1L);

        session = new ReadingSession();
        session.setId(10L);
        session.setBook(book);
        session.setStartTime(Instant.now());
        session.setStatus(SessionStatus.ACTIVE);

        sessionDto = new ReadingSessionDto(10L, 1L, session.getStartTime(), null,
                SessionStatus.ACTIVE, null, null, null, null, null);
    }

    @Test
    void startSession_ShouldReturnCreated() throws Exception {
        StartSessionRequest request = new StartSessionRequest(1L);
        when(sessionService.startSession(any(), eq(1L))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/start")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void stopSession_ShouldReturnSession() throws Exception {
        StopSessionRequest request = new StopSessionRequest(Instant.now(), 50);
        when(sessionService.stopSession(any(), any(), eq(50))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/stop")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void stopSession_ShouldAcceptEmptyBody() throws Exception {
        StopSessionRequest request = new StopSessionRequest(null, null);
        when(sessionService.stopSession(any(), eq(null), eq(null))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/stop")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void getActiveSession_ShouldReturnSession_WhenExists() throws Exception {
        when(sessionService.getActiveSession(any())).thenReturn(Optional.of(session));
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(get("/api/sessions/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void getActiveSession_ShouldReturnNoContent_WhenNotExists() throws Exception {
        when(sessionService.getActiveSession(any())).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/sessions/active"))
                .andExpect(status().isNoContent());
    }

    @Test
    void excludeTime_ShouldReturnSession() throws Exception {
        ExcludeTimeRequest request = new ExcludeTimeRequest(1000L);
        when(sessionService.excludeTime(any(), eq(1000L))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/active/exclude-time")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void pauseSession_ShouldReturnSession() throws Exception {
        when(sessionService.pauseSession(any())).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/active/pause"))
                .andExpect(status().isOk());
    }

    @Test
    void resumeSession_ShouldReturnSession() throws Exception {
        when(sessionService.resumeSession(any())).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/active/resume"))
                .andExpect(status().isOk());
    }

    @Test
    void getSessionsByBook_ShouldReturnList() throws Exception {
        when(sessionService.getSessionsByBook(any(), eq(1L))).thenReturn(List.of(session));
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(get("/api/sessions/book/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10));
    }

    @Test
    void getStreak_ShouldReturnStreakData() throws Exception {
        when(streakService.calculateStreaks(any())).thenReturn(new StreakService.StreakInfo(5, 12));

        mockMvc.perform(get("/api/sessions/streak"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentStreak").value(5))
                .andExpect(jsonPath("$.longestStreak").value(12));
    }
}
