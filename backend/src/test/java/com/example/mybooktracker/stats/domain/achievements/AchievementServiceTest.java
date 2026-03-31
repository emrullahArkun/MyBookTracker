package com.example.mybooktracker.stats.domain.achievements;

import com.example.mybooktracker.auth.domain.User;
import com.example.mybooktracker.books.domain.Book;
import com.example.mybooktracker.sessions.domain.ReadingSession;
import com.example.mybooktracker.stats.application.AchievementContextFactory;
import com.example.mybooktracker.stats.application.AchievementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static com.example.mybooktracker.support.BookFixtures.book;

@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    @Mock
    private AchievementContextFactory contextFactory;

    private AchievementService achievementService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        achievementService = new AchievementService(contextFactory, List.of(
                new SpeedReaderAchievementChecker(),
                new FirstSessionAchievementChecker(),
                new MonthStreakAchievementChecker(),
                new WeekStreakAchievementChecker(),
                new NightOwlAchievementChecker(),
                new EarlyBirdAchievementChecker(),
                new MarathonAchievementChecker(),
                new PageTurnerAchievementChecker(),
                new LibraryBuilderAchievementChecker(),
                new BookwormAchievementChecker()));
    }

    @Test
    void getAchievements_ShouldReturnAllTen() {
        when(contextFactory.build(user, ZoneOffset.UTC)).thenReturn(context());

        List<Achievement> result = achievementService.getAchievements(user);

        assertEquals(10, result.size());
        assertTrue(result.stream().noneMatch(Achievement::unlocked));
    }

    @Test
    void getAchievements_ShouldUnlockFirstSession() {
        when(contextFactory.build(user, ZoneOffset.UTC)).thenReturn(context(0, 0, 0, 1, 0, 0, ZoneOffset.UTC, List.of()));

        Achievement firstSession = getAchievement(achievementService.getAchievements(user), AchievementType.FIRST_SESSION);

        assertTrue(firstSession.unlocked());
        assertEquals("1 sessions", firstSession.unlockedDetail());
    }

    @Test
    void getAchievements_ShouldUnlockThresholdAchievements() {
        when(contextFactory.build(user, ZoneOffset.UTC)).thenReturn(context(10, 5, 1000, 5, 120, 30, ZoneOffset.UTC, List.of()));

        List<Achievement> result = achievementService.getAchievements(user);

        assertTrue(getAchievement(result, AchievementType.BOOKWORM).unlocked());
        assertTrue(getAchievement(result, AchievementType.LIBRARY_BUILDER).unlocked());
        assertTrue(getAchievement(result, AchievementType.PAGE_TURNER).unlocked());
        assertTrue(getAchievement(result, AchievementType.MARATHON).unlocked());
        assertTrue(getAchievement(result, AchievementType.WEEK_STREAK).unlocked());
        assertTrue(getAchievement(result, AchievementType.MONTH_STREAK).unlocked());
    }

    @Test
    void getAchievements_ShouldUseResolvedTimezoneForContextBuild() {
        when(contextFactory.build(user, ZoneId.of("Europe/Berlin")))
                .thenReturn(context(0, 0, 0, 0, 0, 0, ZoneId.of("Europe/Berlin"), List.of()));

        achievementService.getAchievements(user, "Europe/Berlin");

        verify(contextFactory).build(user, ZoneId.of("Europe/Berlin"));
    }

    @Test
    void getAchievements_ShouldDetectEarlyBirdInUserTimezone() {
        ReadingSession session = buildSession(Instant.parse("2026-03-25T04:00:00Z"), Instant.parse("2026-03-25T05:00:00Z"), null);
        when(contextFactory.build(user, ZoneId.of("Europe/Berlin")))
                .thenReturn(context(1, 0, 10, 1, 10, 0, ZoneId.of("Europe/Berlin"), List.of(session)));

        Achievement earlyBird = getAchievement(
                achievementService.getAchievements(user, "Europe/Berlin"),
                AchievementType.EARLY_BIRD);

        assertTrue(earlyBird.unlocked());
    }

    @Test
    void getAchievements_ShouldDetectNightOwlAfterMidnight() {
        ReadingSession session = buildSession(Instant.parse("2026-03-25T01:00:00Z"), Instant.parse("2026-03-25T02:00:00Z"), null);
        when(contextFactory.build(user, ZoneOffset.UTC))
                .thenReturn(context(1, 0, 10, 1, 10, 0, ZoneOffset.UTC, List.of(session)));

        Achievement nightOwl = getAchievement(achievementService.getAchievements(user), AchievementType.NIGHT_OWL);

        assertTrue(nightOwl.unlocked());
    }

    @Test
    void getAchievements_ShouldUnlockSpeedReader() {
        Book book = book().pageCount(200).startDate(LocalDate.of(2026, 3, 23)).completed(true).build();

        ReadingSession session = buildSession(
                Instant.parse("2026-03-25T10:00:00Z"),
                Instant.parse("2026-03-25T11:00:00Z"),
                book);

        when(contextFactory.build(user, ZoneOffset.UTC))
                .thenReturn(context(1, 1, 200, 5, 50, 0, ZoneOffset.UTC, List.of(session)));

        Achievement speedReader = getAchievement(achievementService.getAchievements(user), AchievementType.SPEED_READER);

        assertTrue(speedReader.unlocked());
    }

    @Test
    void getAchievements_ShouldIgnoreInvalidSpeedReaderSessions() {
        ReadingSession session = buildSession(
                Instant.parse("2026-03-25T10:00:00Z"),
                Instant.parse("2026-03-25T11:00:00Z"),
                null);

        when(contextFactory.build(user, ZoneOffset.UTC))
                .thenReturn(context(1, 0, 10, 1, 10, 0, ZoneOffset.UTC, List.of(session)));

        Achievement speedReader = getAchievement(achievementService.getAchievements(user), AchievementType.SPEED_READER);

        assertFalse(speedReader.unlocked());
    }

    @Test
    void getAchievements_ShouldNotUnlockSpeedReaderWhenBookWasCompletedTooSlowly() {
        Book book = book().pageCount(200).startDate(LocalDate.of(2026, 3, 1)).completed(true).build();

        ReadingSession session = buildSession(
                Instant.parse("2026-03-25T10:00:00Z"),
                Instant.parse("2026-03-25T11:00:00Z"),
                book);

        when(contextFactory.build(user, ZoneOffset.UTC))
                .thenReturn(context(1, 1, 200, 5, 50, 0, ZoneOffset.UTC, List.of(session)));

        Achievement speedReader = getAchievement(achievementService.getAchievements(user), AchievementType.SPEED_READER);

        assertFalse(speedReader.unlocked());
    }

    @Test
    void hasSessionInHourRange_ShouldHandleOvernightRangesAndNullStartTimes() {
        ReadingSession nullStart = buildSession(null, Instant.parse("2026-03-25T01:00:00Z"), null);
        ReadingSession overnight = buildSession(
                Instant.parse("2026-03-25T23:30:00Z"),
                Instant.parse("2026-03-26T00:30:00Z"),
                null);
        AchievementContext context = context(0, 0, 0, 0, 0, 0, ZoneOffset.UTC, List.of(nullStart, overnight));

        assertTrue(AchievementCheckerSupport.hasSessionInHourRange(context.sessions(), 22, 26, context));
        assertFalse(AchievementCheckerSupport.hasSessionInHourRange(context.sessions(), 1, 5, context));
    }

    @Test
    void getAchievements_ShouldHandleSessionWithNullStartTime() {
        ReadingSession session = buildSession(null, Instant.parse("2026-03-25T11:00:00Z"), null);
        when(contextFactory.build(user, ZoneOffset.UTC))
                .thenReturn(context(1, 0, 10, 1, 10, 0, ZoneOffset.UTC, List.of(session)));

        Achievement earlyBird = getAchievement(achievementService.getAchievements(user), AchievementType.EARLY_BIRD);

        assertFalse(earlyBird.unlocked());
    }

    private Achievement getAchievement(List<Achievement> achievements, AchievementType type) {
        return achievements.stream()
                .filter(achievement -> achievement.id() == type)
                .findFirst()
                .orElseThrow();
    }

    private AchievementContext context() {
        return context(0, 0, 0, 0, 0, 0, ZoneOffset.UTC, List.of());
    }

    private AchievementContext context(
            long totalBooks,
            long completedBooks,
            long totalPages,
            long totalSessions,
            int maxDailyPages,
            int bestStreak,
            ZoneId zoneId,
            List<ReadingSession> sessions) {
        return new AchievementContext(
                totalBooks,
                completedBooks,
                totalPages,
                totalSessions,
                maxDailyPages,
                bestStreak,
                zoneId,
                sessions);
    }

    private ReadingSession buildSession(Instant startTime, Instant endTime, Book book) {
        ReadingSession session = new ReadingSession();
        session.setStartTime(startTime);
        session.setEndTime(endTime);
        session.attachToBook(book);
        return session;
    }
}
