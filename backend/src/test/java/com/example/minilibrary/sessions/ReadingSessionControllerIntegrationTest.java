package com.example.minilibrary.sessions;

import com.example.minilibrary.books.Book;
import com.example.minilibrary.auth.Role;
import com.example.minilibrary.auth.User;
import com.example.minilibrary.books.BookRepository;
import com.example.minilibrary.auth.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.http.MediaType;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Map;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test") // Uses H2 database
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

                // Create User
                testUser = new User();
                testUser.setEmail("reader@example.com");
                testUser.setPassword(passwordEncoder.encode("password"));
                testUser.setRole(Role.USER);
                testUser.setEnabled(true);
                testUser = userRepository.save(testUser);

                // Create Author

                // Create Book
                testBook = new Book();
                testBook.setTitle("Reading Timer Test");
                testBook.setAuthor("Timer Author");
                testBook.setIsbn("9999999999");
                testBook.setUser(testUser);
                testBook.setStartDate(LocalDate.now());
                testBook = bookRepository.save(testBook);
        }

        @Test
        @WithMockUser(username = "reader@example.com")
        void testStartSession_Success() throws Exception {
                var request = new com.example.minilibrary.sessions.dto.StartSessionRequest(testBook.getId());
                mockMvc.perform(post("/api/sessions/start")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("ACTIVE")))
                                .andExpect(jsonPath("$.bookId", is(testBook.getId().intValue())))
                                .andExpect(jsonPath("$.startTime", notNullValue()));
        }

        @Test
        @WithMockUser(username = "reader@example.com")
        void testStartSession_AlreadyActive_ShouldRestart() throws Exception {
                var request = new com.example.minilibrary.sessions.dto.StartSessionRequest(testBook.getId());
                // Start first session
                mockMvc.perform(post("/api/sessions/start")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());

                // Start second session (should succeed and close the previous one implicitly)
                mockMvc.perform(post("/api/sessions/start")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("ACTIVE")));
        }

        @Test
        @WithMockUser(username = "reader@example.com")
        void testStopSession_Success() throws Exception {
                // Start session
                mockMvc.perform(post("/api/sessions/start")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(
                                                new com.example.minilibrary.sessions.dto.StartSessionRequest(
                                                                testBook.getId()))))
                                .andExpect(status().isOk());

                // Stop session
                var stopRequest = new com.example.minilibrary.sessions.dto.StopSessionRequest(null, null);
                mockMvc.perform(post("/api/sessions/stop")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(stopRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("COMPLETED")))
                                .andExpect(jsonPath("$.endTime", notNullValue()));

                // Check DB
                assertEquals(0, sessionRepository.findFirstByUserAndStatusInOrderByStartTimeDesc(testUser,
                                java.util.List.of(SessionStatus.ACTIVE)).stream().count());
        }

        @Test
        @WithMockUser(username = "reader@example.com")
        void testGetActiveSession_Found() throws Exception {
                // Start session
                mockMvc.perform(post("/api/sessions/start")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(Map.of("bookId", testBook.getId()))))
                                .andExpect(status().isOk());

                // Get Active
                mockMvc.perform(get("/api/sessions/active"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.status", is("ACTIVE")));
        }

        @Test
        @WithMockUser(username = "reader@example.com")
        void testGetActiveSession_None() throws Exception {
                mockMvc.perform(get("/api/sessions/active"))
                                .andExpect(status().isNoContent());
        }
}
