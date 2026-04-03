import { useMemo } from 'react';
import { formatLocalDate } from '../../../shared/lib/date';
import type { Book } from '../../../shared/types/books';
import type { ReadingSession } from '../../../shared/types/sessions';

export const useBookStatsCalculations = (book: Book | null, sessions: ReadingSession[] | null) => {
    // General Stats Calculation
    const stats = useMemo(() => {
        if (!sessions || !book) return null;

        const totalSeconds = sessions.reduce((acc, session) => {
            if (!session.endTime || !session.startTime) return acc;
            const start = new Date(session.startTime).getTime();
            const end = new Date(session.endTime).getTime();
            const paused = Number(session.pausedMillis) || 0;
            return acc + Math.max(0, (end - start - paused)) / 1000;
        }, 0);

        const formatDuration = (seconds: number) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return `${h}h ${m}m`;
        };

        const pagesReadTotal = book.currentPage || 0;
        const totalHoursRaw = totalSeconds / 3600;
        const speedRaw = totalHoursRaw > 0 ? pagesReadTotal / totalHoursRaw : 0;

        const pagesLeft = (book.pageCount || 0) - pagesReadTotal;
        let timeLeft: string | null = null;
        if (speedRaw > 0 && pagesLeft > 0) {
            const hoursLeftRaw = pagesLeft / speedRaw;
            const secondsLeft = hoursLeftRaw * 3600;
            timeLeft = formatDuration(secondsLeft);
        }

        // Sessions Grouping
        const sessionsByDay = sessions.reduce<Record<string, ReadingSession>>((acc, session) => {
            if (!session.endTime || session.endPage === null) return acc;
            const dateObj = new Date(session.endTime);
            const dateKey = formatLocalDate(dateObj);
            if (!acc[dateKey] || new Date(acc[dateKey].endTime!) < dateObj) {
                acc[dateKey] = session;
            }
            return acc;
        }, {});

        const graphData = Object.values(sessionsByDay)
            .sort((a, b) => new Date(a.endTime!).getTime() - new Date(b.endTime!).getTime())
            .map(s => ({
                date: new Date(s.endTime!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                fullDate: formatLocalDate(new Date(s.endTime!)),
                page: s.endPage
            }));

        const progressPercent = book.pageCount ? Math.min(100, Math.round((pagesReadTotal / book.pageCount) * 100)) : 0;

        return {
            totalTime: formatDuration(totalSeconds),
            speed: speedRaw.toFixed(1),
            timeLeft,
            graphData,
            progressPercent,
            pagesRead: pagesReadTotal,
            totalPages: book.pageCount
        };

    }, [sessions, book]);

    // Goal Progress — derived from backend-calculated readingGoalProgress (single source of truth)
    const goalProgress = useMemo(() => {
        if (!book?.readingGoalType || !book?.readingGoalPages) return null;

        const currentPagesRead = book.readingGoalProgress || 0;
        const isGoalReached = currentPagesRead >= book.readingGoalPages;
        const percent = Math.min(100, Math.round((currentPagesRead / book.readingGoalPages) * 100));

        let multiplier = 0;
        if (isGoalReached && book.readingGoalPages > 0) {
            multiplier = Math.floor(currentPagesRead / book.readingGoalPages);
        }

        return {
            current: currentPagesRead,
            target: book.readingGoalPages,
            type: book.readingGoalType,
            percent,
            isGoalReached,
            multiplier
        };
    }, [book]);

    return { stats, goalProgress };
};
