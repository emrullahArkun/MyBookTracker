package com.example.mybooktracker.sessions.api;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.sessions.api.dto.ExcludeTimeRequest;
import com.example.mybooktracker.sessions.api.dto.ReadingSessionDto;
import com.example.mybooktracker.sessions.api.dto.StartSessionRequest;
import com.example.mybooktracker.sessions.api.dto.StopSessionRequest;
import com.example.mybooktracker.sessions.application.ReadingSessionService;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.sessions.domain.ReadingSession;
import com.example.mybooktracker.sessions.domain.SessionStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import tools.jackson.databind.ObjectMapper;

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
import static com.example.mybooktracker.support.BookFixtures.book;

@ExtendWith(MockitoExtension.class)
class ReadingSessionControllerTest {

    @Mock
    private ReadingSessionService sessionService;

    @Mock
    private ReadingSessionMapper sessionMapper;

    @InjectMocks
    private ReadingSessionController sessionController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User user;
    private ReadingSession session;
    private ReadingSessionDto sessionDto;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);

        HandlerMethodArgumentResolver putPrincipal = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(User.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                    NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return user;
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(sessionController)
                .setCustomArgumentResolvers(putPrincipal)
                .build();
        objectMapper = new ObjectMapper();

        Book book = book().id(1L).build();

        session = new ReadingSession();
        session.setId(10L);
        session.attachToBook(book);
        session.setStartTime(Instant.now());
        session.setStatus(SessionStatus.ACTIVE);

        sessionDto = new ReadingSessionDto(10L, 1L, session.getStartTime(), null,
                SessionStatus.ACTIVE, null, null, null, null, null);
    }

    @Test
    void startSession_ShouldReturnCreated() throws Exception {
        StartSessionRequest request = new StartSessionRequest(1L);
        when(sessionService.startSession(eq(user), eq(1L))).thenReturn(session);
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
        when(sessionService.stopSession(eq(user), any(), eq(50))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/stop")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void stopSession_ShouldAcceptEmptyBody() throws Exception {
        StopSessionRequest request = new StopSessionRequest(null, null);
        when(sessionService.stopSession(eq(user), eq(null), eq(null))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/stop")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void getActiveSession_ShouldReturnSession_WhenExists() throws Exception {
        when(sessionService.getActiveSession(eq(user))).thenReturn(Optional.of(session));
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(get("/api/sessions/active"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void getActiveSession_ShouldReturnNoContent_WhenNotExists() throws Exception {
        when(sessionService.getActiveSession(eq(user))).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/sessions/active"))
                .andExpect(status().isNoContent());
    }

    @Test
    void excludeTime_ShouldReturnSession() throws Exception {
        ExcludeTimeRequest request = new ExcludeTimeRequest(1000L);
        when(sessionService.excludeTime(eq(user), eq(1000L))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/active/exclude-time")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    void pauseSession_ShouldReturnSession() throws Exception {
        when(sessionService.pauseSession(eq(user))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/active/pause"))
                .andExpect(status().isOk());
    }

    @Test
    void resumeSession_ShouldReturnSession() throws Exception {
        when(sessionService.resumeSession(eq(user))).thenReturn(session);
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(post("/api/sessions/active/resume"))
                .andExpect(status().isOk());
    }

    @Test
    void getSessionsByBook_ShouldReturnList() throws Exception {
        when(sessionService.getSessionsByBook(eq(user), eq(1L))).thenReturn(List.of(session));
        when(sessionMapper.toDto(session)).thenReturn(sessionDto);

        mockMvc.perform(get("/api/sessions/book/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10));
    }

}
