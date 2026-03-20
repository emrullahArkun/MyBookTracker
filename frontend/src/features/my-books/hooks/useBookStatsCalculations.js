import { useMemo } from 'react';

/**
 * Hook to calculate reading stats and goal progress based on book and sessions data.
 */
export const useBookStatsCalculations = (book, sessions) => {
    // General Stats Calculation
    const stats = useMemo(() => {
        if (!sessions || !book) return null;

        const totalSeconds = sessions.reduce((acc, session) => {
            if (!session.endTime || !session.startTime) return acc;
            const start = new Date(session.startTime).getTime();
            const end = new Date(session.endTime).getTime();
            const paused = session.pausedMillis || 0;
            return acc + (end - start - paused) / 1000;
        }, 0);

        const formatDuration = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            return `${h}h ${m}m`;
        };

        const pagesReadTotal = book.currentPage || 0;
        const totalHoursRaw = totalSeconds / 3600;
        const speedRaw = totalHoursRaw > 0 ? pagesReadTotal / totalHoursRaw : 0;

        const pagesLeft = (book.pageCount || 0) - pagesReadTotal;
        let timeLeft = null;
        if (speedRaw > 0 && pagesLeft > 0) {
            const hoursLeftRaw = pagesLeft / speedRaw;
            const secondsLeft = hoursLeftRaw * 3600;
            timeLeft = formatDuration(secondsLeft);
        }

        // Sessions Grouping
        const sessionsByDay = sessions.reduce((acc, session) => {
            if (!session.endTime || session.endPage === null) return acc;
            const dateObj = new Date(session.endTime);
            const dateKey = dateObj.toLocaleDateString();
            if (!acc[dateKey] || new Date(acc[dateKey].endTime) < dateObj) {
                acc[dateKey] = session;
            }
            return acc;
        }, {});

        const graphData = Object.values(sessionsByDay)
            .sort((a, b) => new Date(a.endTime) - new Date(b.endTime))
            .map(s => ({
                date: new Date(s.endTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                fullDate: new Date(s.endTime).toLocaleDateString(),
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

    // Goal Progress Calculation
    const goalProgress = useMemo(() => {
        if (!book?.readingGoalType || !book?.readingGoalPages || !sessions) return null;

        let startDate = new Date();
        startOfTime(startDate, book.readingGoalType);

        function startOfTime(date, type) {
            date.setHours(0, 0, 0, 0);
            if (type === 'WEEKLY') {
                const day = date.getDay(); // 0=Sun
                // EU Week starts Monday (1). 
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                date.setDate(diff);
            } else {
                date.setDate(1); // 1st of month
            }
        }

        // Sort sessions to handle fallback calculation
        const sortedSessions = [...sessions].sort((a, b) => new Date(a.endTime) - new Date(b.endTime));

        let currentPagesRead = 0;

        sortedSessions.forEach((session, index) => {
            const sessionEnd = new Date(session.endTime);
            if (sessionEnd < startDate) return;

            let added = 0;
            if (session.pagesRead != null) {
                added = session.pagesRead;
            } else {
                // Fallback
                const prevEndPage = index > 0 ? sortedSessions[index - 1].endPage : 0;
                added = (session.endPage || 0) - (prevEndPage || 0);
            }
            if (added > 0) currentPagesRead += added;
        });

        const isGoalReached = currentPagesRead >= book.readingGoalPages;
        const percent = Math.min(100, Math.round((currentPagesRead / book.readingGoalPages) * 100));

        // Multiplier calculation (e.g. 100/20 = 5x)
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
    }, [book, sessions]);

    return { stats, goalProgress };
};
