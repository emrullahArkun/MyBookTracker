package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.sessions.ReadingSession;
import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.StreakService;
import com.example.readflow.sessions.SessionStatus;
import com.example.readflow.stats.dto.AchievementDto;
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

    // --- getAchievements ---

    @Test
    void getAchievements_ShouldReturnAllTen() {
        when(bookRepository.countByUser(user)).thenReturn(0L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        assertEquals(10, result.size());
        assertTrue(result.stream().noneMatch(AchievementDto::unlocked));
    }

    @Test
    void getAchievements_ShouldUnlockFirstSession() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(30L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(1L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(1, 1));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(buildSession(LocalDate.now(), 30, 10)));
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto firstSession = result.stream()
                .filter(a -> a.id() == AchievementType.FIRST_SESSION).findFirst().orElseThrow();
        assertTrue(firstSession.unlocked());
    }

    @Test
    void getAchievements_ShouldUnlockBookworm() {
        when(bookRepository.countByUser(user)).thenReturn(5L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(5L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(1500L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(20L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(3, 8));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(buildSession(LocalDate.now(), 50, 10)));
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto bookworm = result.stream()
                .filter(a -> a.id() == AchievementType.BOOKWORM).findFirst().orElseThrow();
        assertTrue(bookworm.unlocked());
    }

    @Test
    void getAchievements_ShouldUnlockMarathon() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(120L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(2L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(1, 1));
        // Two sessions on same day = 120 pages total
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(
                        buildSession(LocalDate.now(), 60, 10),
                        buildSession(LocalDate.now(), 60, 14)));
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto marathon = result.stream()
                .filter(a -> a.id() == AchievementType.MARATHON).findFirst().orElseThrow();
        assertTrue(marathon.unlocked());
    }

    @Test
    void getAchievements_ShouldDetectEarlyBird() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(10L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(1L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(buildSession(LocalDate.now(), 10, 6))); // 6 AM
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto earlyBird = result.stream()
                .filter(a -> a.id() == AchievementType.EARLY_BIRD).findFirst().orElseThrow();
        assertTrue(earlyBird.unlocked());
    }

    @Test
    void getAchievements_ShouldDetectNightOwl() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(10L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(1L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(buildSession(LocalDate.now(), 10, 23))); // 11 PM
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto nightOwl = result.stream()
                .filter(a -> a.id() == AchievementType.NIGHT_OWL).findFirst().orElseThrow();
        assertTrue(nightOwl.unlocked());
    }

    @Test
    void getAchievements_ShouldDetectNightOwlAfterMidnight() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(10L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(1L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(buildSession(LocalDate.now(), 10, 1))); // 1 AM
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto nightOwl = result.stream()
                .filter(a -> a.id() == AchievementType.NIGHT_OWL).findFirst().orElseThrow();
        assertTrue(nightOwl.unlocked());
    }

    @Test
    void getAchievements_ShouldUnlockWeekStreak() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(100L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(7L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(7, 7));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto weekStreak = result.stream()
                .filter(a -> a.id() == AchievementType.WEEK_STREAK).findFirst().orElseThrow();
        assertTrue(weekStreak.unlocked());
    }

    @Test
    void getAchievements_ShouldUnlockSpeedReader() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(1L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(200L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(5L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(true);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto speed = result.stream()
                .filter(a -> a.id() == AchievementType.SPEED_READER).findFirst().orElseThrow();
        assertTrue(speed.unlocked());
    }

    @Test
    void getAchievements_ShouldNotUnlockSpeedReader_WhenNoFastBook() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(50L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(2L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto speed = result.stream()
                .filter(a -> a.id() == AchievementType.SPEED_READER).findFirst().orElseThrow();
        assertFalse(speed.unlocked());
    }

    @Test
    void getAchievements_ShouldUnlockLibraryBuilder() {
        when(bookRepository.countByUser(user)).thenReturn(10L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto lib = result.stream()
                .filter(a -> a.id() == AchievementType.LIBRARY_BUILDER).findFirst().orElseThrow();
        assertTrue(lib.unlocked());
    }

    @Test
    void getAchievements_ShouldUnlockPageTurner() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(1000L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(10L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto pt = result.stream()
                .filter(a -> a.id() == AchievementType.PAGE_TURNER).findFirst().orElseThrow();
        assertTrue(pt.unlocked());
    }

    @Test
    void getAchievements_ShouldUnlockMonthStreak() {
        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(100L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(30L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(30, 30));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        AchievementDto monthStreak = result.stream()
                .filter(a -> a.id() == AchievementType.MONTH_STREAK).findFirst().orElseThrow();
        assertTrue(monthStreak.unlocked());
    }

    @Test
    void getAchievements_ShouldHandleSessionWithNullStartTime() {
        ReadingSession noStart = new ReadingSession();
        noStart.setUser(user);
        noStart.setStatus(SessionStatus.COMPLETED);
        noStart.setStartTime(null);
        noStart.setEndTime(Instant.now());
        noStart.setPagesRead(10);
        noStart.setPausedMillis(0L);

        when(bookRepository.countByUser(user)).thenReturn(1L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(10L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(1L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(noStart));
        when(bookRepository.existsSpeedReadBook(eq(user), any(LocalDate.class))).thenReturn(false);

        List<AchievementDto> result = statsService.getAchievements(user);
        // Should not crash, early bird/night owl should not be unlocked
        AchievementDto earlyBird = result.stream()
                .filter(a -> a.id() == AchievementType.EARLY_BIRD).findFirst().orElseThrow();
        assertFalse(earlyBird.unlocked());
    }

}
