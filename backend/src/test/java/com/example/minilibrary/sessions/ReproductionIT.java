package com.example.minilibrary.sessions;

import com.example.minilibrary.auth.User;
import com.example.minilibrary.books.Book;
import com.example.minilibrary.books.BookRepository;
import com.example.minilibrary.auth.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class ReproductionIT {

    @Autowired
    private ReadingSessionService sessionService;
    @Autowired
    private ReadingSessionRepository sessionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BookRepository bookRepository;

    private User testUser;
    private Book testBook;

    @BeforeEach
    void setUp() {
        // Clear DB
        sessionRepository.deleteAll();
        bookRepository.deleteAll();

        userRepository.deleteAll();

        // Create User
        testUser = new User();
        testUser.setEmail("test@example.com");
        testUser.setPassword("password");
        testUser.setRole(com.example.minilibrary.auth.Role.USER);
        testUser.setEnabled(true);
        testUser = userRepository.save(testUser);

        // Create Book
        testBook = new Book();
        testBook.setTitle("Integration Book");
        testBook.setIsbn("123-456");
        testBook.setAuthor("Test Author");
        testBook.setUser(testUser);
        testBook.setPageCount(100);
        testBook.setCurrentPage(0);
        testBook.setStartDate(java.time.LocalDate.now());
        testBook = bookRepository.save(testBook);
    }

    @Test
    void testSessionStartStopPersistence() {
        // 1. Start Session
        ReadingSession session = sessionService.startSession(testUser, testBook.getId());
        assertNotNull(session);
        assertEquals(SessionStatus.ACTIVE, session.getStatus());
        assertNotNull(session.getStartTime());

        // Verify active session exists
        Optional<ReadingSession> active = sessionService.getActiveSession(testUser);
        assertTrue(active.isPresent());
        assertEquals(session.getId(), active.get().getId());

        // 2. Stop Session
        sessionService.stopSession(testUser, Instant.now(), 10);

        // Verify NO active session
        Optional<ReadingSession> activeAfterStop = sessionService.getActiveSession(testUser);
        assertFalse(activeAfterStop.isPresent(), "Should clearly be stopped");

        // Verify Status in DB
        ReadingSession stoppedSession = sessionRepository.findById(session.getId()).orElseThrow();
        assertEquals(SessionStatus.COMPLETED, stoppedSession.getStatus());
    }

    @Test
    void testStartStopStartPersist() {
        // 1. Start & Stop
        sessionService.startSession(testUser, testBook.getId());
        sessionService.stopSession(testUser, Instant.now(), 10);
        assertFalse(sessionService.getActiveSession(testUser).isPresent());

        // 2. Start AGAIN
        ReadingSession session2 = sessionService.startSession(testUser, testBook.getId());
        assertTrue(sessionService.getActiveSession(testUser).isPresent());

        // 3. Stop AGAIN
        sessionService.stopSession(testUser, Instant.now(), 20);

        // Final Check
        assertFalse(sessionService.getActiveSession(testUser).isPresent(), "Should be stopped again");
    }
}
