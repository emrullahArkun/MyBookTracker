package com.example.readflow.stats;

import com.example.readflow.books.Book;
import com.example.readflow.sessions.ReadingSession;
import com.example.readflow.stats.dto.AchievementDto;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

// Strategy pattern: each achievement rule lives in its own interchangeable checker.
public interface AchievementChecker {

    AchievementType type();

    AchievementDto check(AchievementContext context);
}

abstract class ThresholdAchievementChecker implements AchievementChecker {

    @Override
    public AchievementDto check(AchievementContext context) {
        long actual = actual(context);
        long threshold = threshold();
        boolean unlocked = actual >= threshold;
        String progress = unlocked ? actual + " " + unit() : actual + "/" + threshold;
        return new AchievementDto(type(), unlocked, progress);
    }

    protected abstract long actual(AchievementContext context);

    protected abstract long threshold();

    protected abstract String unit();
}

@Component
class FirstSessionAchievementChecker implements AchievementChecker {

    @Override
    public AchievementType type() {
        return AchievementType.FIRST_SESSION;
    }

    @Override
    public AchievementDto check(AchievementContext context) {
        return new AchievementDto(
                type(),
                context.totalSessions() >= 1,
                context.totalSessions() >= 1 ? context.totalSessions() + " sessions" : null);
    }
}

@Component
class BookwormAchievementChecker extends ThresholdAchievementChecker {

    @Override
    public AchievementType type() {
        return AchievementType.BOOKWORM;
    }

    @Override
    protected long actual(AchievementContext context) {
        return context.completedBooks();
    }

    @Override
    protected long threshold() {
        return 5;
    }

    @Override
    protected String unit() {
        return "books";
    }
}

@Component
class LibraryBuilderAchievementChecker extends ThresholdAchievementChecker {

    @Override
    public AchievementType type() {
        return AchievementType.LIBRARY_BUILDER;
    }

    @Override
    protected long actual(AchievementContext context) {
        return context.totalBooks();
    }

    @Override
    protected long threshold() {
        return 10;
    }

    @Override
    protected String unit() {
        return "books";
    }
}

@Component
class PageTurnerAchievementChecker extends ThresholdAchievementChecker {

    @Override
    public AchievementType type() {
        return AchievementType.PAGE_TURNER;
    }

    @Override
    protected long actual(AchievementContext context) {
        return context.totalPages();
    }

    @Override
    protected long threshold() {
        return 1000;
    }

    @Override
    protected String unit() {
        return "pages";
    }
}

@Component
class MarathonAchievementChecker extends ThresholdAchievementChecker {

    @Override
    public AchievementType type() {
        return AchievementType.MARATHON;
    }

    @Override
    protected long actual(AchievementContext context) {
        return context.maxDailyPages();
    }

    @Override
    protected long threshold() {
        return 100;
    }

    @Override
    protected String unit() {
        return "pages";
    }
}

@Component
class EarlyBirdAchievementChecker implements AchievementChecker {

    private static final int FROM_HOUR = 5;
    private static final int TO_HOUR = 8;

    @Override
    public AchievementType type() {
        return AchievementType.EARLY_BIRD;
    }

    @Override
    public AchievementDto check(AchievementContext context) {
        return AchievementCheckerSupport.unlocked(
                type(),
                AchievementCheckerSupport.hasSessionInHourRange(context.sessions(), FROM_HOUR, TO_HOUR, context));
    }
}

@Component
class NightOwlAchievementChecker implements AchievementChecker {

    private static final int FROM_HOUR = 22;
    private static final int TO_HOUR = 28;

    @Override
    public AchievementType type() {
        return AchievementType.NIGHT_OWL;
    }

    @Override
    public AchievementDto check(AchievementContext context) {
        return AchievementCheckerSupport.unlocked(
                type(),
                AchievementCheckerSupport.hasSessionInHourRange(context.sessions(), FROM_HOUR, TO_HOUR, context));
    }
}

@Component
class WeekStreakAchievementChecker extends ThresholdAchievementChecker {

    @Override
    public AchievementType type() {
        return AchievementType.WEEK_STREAK;
    }

    @Override
    protected long actual(AchievementContext context) {
        return context.bestStreak();
    }

    @Override
    protected long threshold() {
        return 7;
    }

    @Override
    protected String unit() {
        return "days";
    }
}

@Component
class MonthStreakAchievementChecker extends ThresholdAchievementChecker {

    @Override
    public AchievementType type() {
        return AchievementType.MONTH_STREAK;
    }

    @Override
    protected long actual(AchievementContext context) {
        return context.bestStreak();
    }

    @Override
    protected long threshold() {
        return 30;
    }

    @Override
    protected String unit() {
        return "days";
    }
}

@Component
class SpeedReaderAchievementChecker implements AchievementChecker {

    private static final double SPEED_READ_PAGES_PER_DAY = 50.0;

    @Override
    public AchievementType type() {
        return AchievementType.SPEED_READER;
    }

    @Override
    public AchievementDto check(AchievementContext context) {
        for (ReadingSession session : context.sessions()) {
            Book book = session.getBook();
            if (book == null || !Boolean.TRUE.equals(book.getCompleted())
                    || book.getStartDate() == null || book.getPageCount() == null
                    || book.getPageCount() <= 0 || session.getEndTime() == null) {
                continue;
            }
            LocalDate completedDay = session.getEndTime().atZone(context.zoneId()).toLocalDate();
            long days = Math.max(1, ChronoUnit.DAYS.between(book.getStartDate(), completedDay));
            if ((double) book.getPageCount() / days >= SPEED_READ_PAGES_PER_DAY) {
                return AchievementCheckerSupport.unlocked(type(), true);
            }
        }
        return AchievementCheckerSupport.unlocked(type(), false);
    }
}

final class AchievementCheckerSupport {

    private AchievementCheckerSupport() {}

    static AchievementDto unlocked(AchievementType type, boolean unlocked) {
        return new AchievementDto(type, unlocked, null);
    }

    static boolean hasSessionInHourRange(
            List<ReadingSession> sessions,
            int fromHour,
            int toHour,
            AchievementContext context) {
        for (ReadingSession session : sessions) {
            if (session.getStartTime() == null) {
                continue;
            }
            int hour = session.getStartTime().atZone(context.zoneId()).getHour();
            if (toHour > 24) {
                if (hour >= fromHour || hour < (toHour - 24)) {
                    return true;
                }
                continue;
            }
            if (hour >= fromHour && hour < toHour) {
                return true;
            }
        }
        return false;
    }
}
