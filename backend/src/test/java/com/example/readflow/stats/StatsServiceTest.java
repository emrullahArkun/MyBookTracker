package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.sessions.ReadingSession;
import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.StreakService;
import com.example.readflow.sessions.SessionStatus;
import com.example.readflow.stats.dto.StatsOverviewDto;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class StatsServiceTest {

    @Mock private BookRepository bookRepository;
    @Mock private ReadingSessionRepository sessionRepository;
    @Mock private StreakService streakService;
    @InjectMocks private StatsService statsService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
    }

    private ReadingSession buildSession(LocalDate date, int pagesRead, int startHour) {
        ReadingSession s = new ReadingSession();
        s.setUser(user);
        s.setStatus(SessionStatus.COMPLETED);
        Instant start = date.atTime(startHour, 0).atZone(ZoneOffset.UTC).toInstant();
        s.setStartTime(start);
        s.setEndTime(start.plusSeconds(3600)); // 1 hour later
        s.setPagesRead(pagesRead);
        s.setPausedMillis(0L);
        return s;
    }

    // --- getOverview ---

    @Test
    void getOverview_ShouldReturnAllStats() {
        when(bookRepository.countByUser(user)).thenReturn(5L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(2L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(500L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(
                        buildSession(LocalDate.now().minusDays(1), 30, 10),
                        buildSession(LocalDate.now(), 50, 14)));
        when(bookRepository.findAllCategoriesByUser(user))
                .thenReturn(List.of("Thriller", "Krimi", "Thriller"));
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(3, 7));

        StatsOverviewDto result = statsService.getOverview(user);

        assertEquals(5, result.totalBooks());
        assertEquals(2, result.completedBooks());
        assertEquals(500, result.totalPagesRead());
        assertTrue(result.totalReadingMinutes() > 0);
        assertEquals(3, result.currentStreak());
        assertEquals(7, result.longestStreak());
        assertEquals(2, result.dailyActivity().size());
        assertFalse(result.genreDistribution().isEmpty());
        assertEquals("Thriller", result.genreDistribution().get(0).genre());
    }

    @Test
    void getOverview_ShouldHandleEmptyData() {
        when(bookRepository.countByUser(user)).thenReturn(0L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        when(bookRepository.findAllCategoriesByUser(user)).thenReturn(Collections.emptyList());
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));

        StatsOverviewDto result = statsService.getOverview(user);

        assertEquals(0, result.totalBooks());
        assertEquals(0, result.totalReadingMinutes());
        assertTrue(result.dailyActivity().isEmpty());
        assertTrue(result.genreDistribution().isEmpty());
    }

    @Test
    void getOverview_ShouldSkipSessionsWithNullPagesRead() {
        ReadingSession noPages = buildSession(LocalDate.now(), 0, 10);
        noPages.setPagesRead(null);

        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(noPages));
        when(bookRepository.findAllCategoriesByUser(user)).thenReturn(Collections.emptyList());
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));

        StatsOverviewDto result = statsService.getOverview(user);
        assertTrue(result.dailyActivity().isEmpty());
    }

    @Test
    void getOverview_ShouldSkipSessionsWithNullEndTime() {
        ReadingSession noEnd = new ReadingSession();
        noEnd.setUser(user);
        noEnd.setStatus(SessionStatus.COMPLETED);
        noEnd.setStartTime(Instant.now().minusSeconds(3600));
        noEnd.setEndTime(null);
        noEnd.setPagesRead(10);
        noEnd.setPausedMillis(0L);

        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(noEnd));
        when(bookRepository.findAllCategoriesByUser(user)).thenReturn(Collections.emptyList());
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));

        StatsOverviewDto result = statsService.getOverview(user);
        assertEquals(0, result.totalReadingMinutes());
    }

    @Test
    void getOverview_ShouldHandleNegativeDurationAfterPause() {
        ReadingSession s = buildSession(LocalDate.now(), 10, 10);
        s.setPausedMillis(7_200_000L); // 2h paused but session was only 1h

        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(10L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(s));
        when(bookRepository.findAllCategoriesByUser(user)).thenReturn(Collections.emptyList());
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));

        StatsOverviewDto result = statsService.getOverview(user);
        assertEquals(0, result.totalReadingMinutes());
    }

    @Test
    void getOverview_ShouldHandleSessionWithNullStartTime() {
        ReadingSession s = new ReadingSession();
        s.setUser(user);
        s.setStatus(SessionStatus.COMPLETED);
        s.setStartTime(null);
        s.setEndTime(Instant.now());
        s.setPagesRead(10);
        s.setPausedMillis(0L);

        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(10L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(s));
        when(bookRepository.findAllCategoriesByUser(user)).thenReturn(Collections.emptyList());
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));

        StatsOverviewDto result = statsService.getOverview(user);
        assertEquals(0, result.totalReadingMinutes());
    }

    @Test
    void getOverview_ShouldHandleZeroPagesReadInDailyActivity() {
        ReadingSession s = buildSession(LocalDate.now(), 0, 10);
        s.setPagesRead(0);

        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(s));
        when(bookRepository.findAllCategoriesByUser(user)).thenReturn(Collections.emptyList());
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));

        StatsOverviewDto result = statsService.getOverview(user);
        assertTrue(result.dailyActivity().isEmpty());
    }

    @Test
    void getOverview_ShouldSubtractPausedTime() {
        ReadingSession s = buildSession(LocalDate.now(), 20, 10);
        s.setPausedMillis(1800_000L); // 30 min paused

        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(20L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(s));
        when(bookRepository.findAllCategoriesByUser(user)).thenReturn(Collections.emptyList());
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));

        StatsOverviewDto result = statsService.getOverview(user);
        assertEquals(30, result.totalReadingMinutes()); // 60min - 30min paused
    }

    @Test
    void getOverview_ShouldLimitGenresToEight() {
        List<String> cats = List.of("A", "B", "C", "D", "E", "F", "G", "H", "I", "J");
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        when(bookRepository.findAllCategoriesByUser(user)).thenReturn(cats);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));

        StatsOverviewDto result = statsService.getOverview(user);
        assertTrue(result.genreDistribution().size() <= 8);
    }

    @Test
    void getOverview_ShouldHandleNullCategories() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        List<String> catsWithNull = new java.util.ArrayList<>();
        catsWithNull.add(null);
        catsWithNull.add("Fiction");
        when(bookRepository.findAllCategoriesByUser(user)).thenReturn(catsWithNull);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));

        StatsOverviewDto result = statsService.getOverview(user);
        assertEquals(1, result.genreDistribution().size());
        assertEquals("Fiction", result.genreDistribution().get(0).genre());
    }

}
