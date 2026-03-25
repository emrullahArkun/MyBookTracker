package com.example.readflow.stats;

import com.example.readflow.auth.User;
import com.example.readflow.books.BookRepository;
import com.example.readflow.sessions.ReadingSession;
import com.example.readflow.sessions.ReadingSessionRepository;
import com.example.readflow.sessions.StreakService;
import com.example.readflow.sessions.SessionStatus;
import com.example.readflow.stats.dto.AchievementDto;
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
class AchievementServiceTest {

    @Mock private BookRepository bookRepository;
    @Mock private ReadingSessionRepository sessionRepository;
    @Mock private StreakService streakService;
    @InjectMocks private AchievementService achievementService;

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

    @Test
    void getAchievements_ShouldReturnAllTen() {
        when(bookRepository.countByUser(user)).thenReturn(0L);
        when(bookRepository.countByUserAndCompletedTrue(user)).thenReturn(0L);
        when(sessionRepository.sumPagesReadByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(sessionRepository.countCompletedByUser(user, SessionStatus.COMPLETED)).thenReturn(0L);
        when(streakService.calculateStreaks(user)).thenReturn(new StreakService.StreakInfo(0, 0));
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(Collections.emptyList());

        List<AchievementDto> result = achievementService.getAchievements(user);
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

        List<AchievementDto> result = achievementService.getAchievements(user);
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

        List<AchievementDto> result = achievementService.getAchievements(user);
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
        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(
                        buildSession(LocalDate.now(), 60, 10),
                        buildSession(LocalDate.now(), 60, 14)));

        List<AchievementDto> result = achievementService.getAchievements(user);
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
                .thenReturn(List.of(buildSession(LocalDate.now(), 10, 6)));

        List<AchievementDto> result = achievementService.getAchievements(user);
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
                .thenReturn(List.of(buildSession(LocalDate.now(), 10, 23)));

        List<AchievementDto> result = achievementService.getAchievements(user);
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
                .thenReturn(List.of(buildSession(LocalDate.now(), 10, 1)));

        List<AchievementDto> result = achievementService.getAchievements(user);
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

        List<AchievementDto> result = achievementService.getAchievements(user);
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
        ReadingSession fastSession = buildSession(LocalDate.now(), 200, 10);
        com.example.readflow.books.Book b = new com.example.readflow.books.Book();
        b.setCompleted(true);
        b.setStartDate(LocalDate.now().minusDays(2));
        b.setPageCount(200);
        fastSession.setBook(b);

        when(sessionRepository.findCompletedSessionsSince(eq(user), any(), eq(SessionStatus.COMPLETED)))
                .thenReturn(List.of(fastSession));

        List<AchievementDto> result = achievementService.getAchievements(user);
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

        List<AchievementDto> result = achievementService.getAchievements(user);
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

        List<AchievementDto> result = achievementService.getAchievements(user);
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

        List<AchievementDto> result = achievementService.getAchievements(user);
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

        List<AchievementDto> result = achievementService.getAchievements(user);
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

        List<AchievementDto> result = achievementService.getAchievements(user);
        AchievementDto earlyBird = result.stream()
                .filter(a -> a.id() == AchievementType.EARLY_BIRD).findFirst().orElseThrow();
        assertFalse(earlyBird.unlocked());
    }
}
