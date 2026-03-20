package com.example.readflow.sessions;

import com.example.readflow.books.Book;
import com.example.readflow.auth.Role;
import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.auth.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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

                testBook = new Book();
                testBook.setTitle("Reading Timer Test");
                testBook.setAuthor("Timer Author");
                testBook.setIsbn("9999999999");
                testBook.setUser(testUser);
                testBook.setStartDate(LocalDate.now());
                testBook = bookRepository.save(testBook);
        }

        @Test
        void testStartSession_Success() throws Exception {
                var request = new com.example.readflow.sessions.dto.StartSessionRequest(testBook.getId());
                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("ACTIVE")))
                                .andExpect(jsonPath("$.bookId", is(testBook.getId().intValue())))
                                .andExpect(jsonPath("$.startTime", notNullValue()));
        }

        @Test
        void testStartSession_AlreadyActive_ShouldRestart() throws Exception {
                var request = new com.example.readflow.sessions.dto.StartSessionRequest(testBook.getId());
                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());

                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("ACTIVE")));
        }

        @Test
        void testStopSession_Success() throws Exception {
                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                                new com.example.readflow.sessions.dto.StartSessionRequest(
                                                                testBook.getId()))))
                                .andExpect(status().isOk());

                var stopRequest = new com.example.readflow.sessions.dto.StopSessionRequest(null, null);
                mockMvc.perform(post("/api/sessions/stop")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(stopRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("COMPLETED")))
                                .andExpect(jsonPath("$.endTime", notNullValue()));

                assertEquals(0, sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(testUser,
                                java.util.List.of(SessionStatus.ACTIVE)).stream().count());
        }

        @Test
        void testGetActiveSession_Found() throws Exception {
                mockMvc.perform(post("/api/sessions/start")
                                .with(jwtForUser())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of("bookId", testBook.getId()))))
                                .andExpect(status().isOk());

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
                return jwt().jwt(builder -> builder
                        .subject(testUser.getEmail())
                        .claim("userId", testUser.getId())
                        .claim("role", testUser.getRole().name()));
        }
}
