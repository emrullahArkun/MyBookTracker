package com.example.mybooktracker.sessions.api;

import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.auth.domain.Role;
import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.infra.persistence.BookRepository;
import com.example.mybooktracker.auth.infra.persistence.UserRepository;
import com.example.mybooktracker.sessions.domain.ReadingSession;
import com.example.mybooktracker.sessions.domain.SessionStatus;
import com.example.mybooktracker.sessions.infra.persistence.ReadingSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import com.example.mybooktracker.shared.security.UserAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Map;
import tools.jackson.databind.ObjectMapper;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static com.example.mybooktracker.support.BookFixtures.book;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReadingSessionControllerIntegrationTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private BookRepository bookRepository;

        @Autowired
        private ReadingSessionRepository sessionRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Autowired
        private ObjectMapper objectMapper;

        private User testUser;
        private Book testBook;

        @BeforeEach
        void setUp() {
                sessionRepository.deleteAll();
                bookRepository.deleteAll();
                userRepository.deleteAll();

                testUser = new User();
                testUser.setEmail("reader@example.com");
                testUser.setPassword(passwordEncoder.encode("password"));
                testUser.setRole(Role.USER);
                testUser.setEnabled(true);
                testUser = userRepository.save(testUser);

                testBook = book().title("Reading Timer Test").author("Timer Author").isbn("9999999999")
                                .user(testUser).startDate(LocalDate.now()).build();
                testBook = bookRepository.save(testBook);
        }

        @Test
        void testStartSession_Success() throws Exception {
                var request = new com.example.mybooktracker.sessions.api.dto.StartSessionRequest(testBook.getId());
                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser()).with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.status", is("ACTIVE")))
                                .andExpect(jsonPath("$.bookId", is(testBook.getId().intValue())))
                                .andExpect(jsonPath("$.startTime", notNullValue()));
        }

        @Test
        void testStartSession_AlreadyActive_ShouldRestart() throws Exception {
                var request = new com.example.mybooktracker.sessions.api.dto.StartSessionRequest(testBook.getId());
                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser()).with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated());

                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser()).with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.status", is("ACTIVE")));
        }

        @Test
        void testStopSession_Success() throws Exception {
                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser()).with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                                new com.example.mybooktracker.sessions.api.dto.StartSessionRequest(
                                                                testBook.getId()))))
                                .andExpect(status().isCreated());

                var stopRequest = new com.example.mybooktracker.sessions.api.dto.StopSessionRequest(null, null);
                mockMvc.perform(post("/api/sessions/stop")
                                .with(jwtForUser()).with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(stopRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("COMPLETED")))
                                .andExpect(jsonPath("$.endTime", notNullValue()));

                assertEquals(0, sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(testUser,
                                java.util.List.of(SessionStatus.ACTIVE)).stream().count());
        }

        @Test
        void testStopSession_WithEndTimeAndEndPage_ShouldPersistValues() throws Exception {
                testBook.changePageCount(200);
                testBook = bookRepository.save(testBook);

                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser()).with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                                new com.example.mybooktracker.sessions.api.dto.StartSessionRequest(
                                                                testBook.getId()))))
                                .andExpect(status().isCreated());

                Instant fixedEndTime = Instant.parse("2026-03-25T14:30:00Z");
                var stopRequest = new com.example.mybooktracker.sessions.api.dto.StopSessionRequest(fixedEndTime, 50);
                mockMvc.perform(post("/api/sessions/stop")
                                .with(jwtForUser()).with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(stopRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("COMPLETED")))
                                .andExpect(jsonPath("$.endTime", is("2026-03-25T14:30:00Z")))
                                .andExpect(jsonPath("$.endPage", is(50)));

                Book updatedBook = bookRepository.findById(testBook.getId()).orElseThrow();
                assertEquals(50, updatedBook.getCurrentPage());
                assertEquals(false, updatedBook.getCompleted());

                ReadingSession stoppedSession = sessionRepository
                                .findFirstByUserAndStatusInOrderByStartTimeDesc(testUser,
                                                java.util.List.of(SessionStatus.COMPLETED))
                                .orElseThrow();
                assertEquals(fixedEndTime, stoppedSession.getEndTime());
                assertEquals(50, stoppedSession.getEndPage());
        }

        @Test
        void testGetActiveSession_Found() throws Exception {
                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser()).with(csrf())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of("bookId", testBook.getId()))))
                                .andExpect(status().isCreated());

                mockMvc.perform(get("/api/sessions/active").with(jwtForUser()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("ACTIVE")));
        }

        @Test
        void testGetActiveSession_None() throws Exception {
                mockMvc.perform(get("/api/sessions/active").with(jwtForUser()))
                                .andExpect(status().isNoContent());
        }

        private RequestPostProcessor jwtForUser() {
                Jwt jwt = Jwt.withTokenValue("test-token")
                        .header("alg", "HS256")
                        .subject(testUser.getEmail())
                        .claim("userId", testUser.getId())
                        .claim("role", testUser.getRole().name())
                        .issuedAt(Instant.now())
                        .expiresAt(Instant.now().plusSeconds(3600))
                        .build();
                return authentication(new UserAuthenticationToken(jwt, testUser, Collections.emptyList()));
        }
}
