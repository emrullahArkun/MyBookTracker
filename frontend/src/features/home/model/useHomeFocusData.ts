import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/model';
import { booksApi } from '../../library/api';
import { useGoalsData } from '../../goals/model/useGoalsData';
import { useReadingSessionContext } from '../../reading-session/model/ReadingSessionContext';
import statsApi from '../../stats/api/statsApi';
import type { Book } from '../../../shared/types/books';
import type { DailyActivity } from '../../../shared/types/stats';
import {
    buildReadingRhythmSummary,
    buildResumeSuggestion,
    buildTodaySuggestion,
} from './homeInsights';

const HOME_BOOK_PAGE_SIZE = 24;

const sortBooksForFocus = (books: Book[]): Book[] => {
    return [...books].sort((a, b) => {
        const aCompleted = Boolean(a.completed);
        const bCompleted = Boolean(b.completed);
        if (aCompleted !== bCompleted) {
            return aCompleted ? 1 : -1;
        }

        const aStarted = (a.currentPage || 0) > 0 ? 1 : 0;
        const bStarted = (b.currentPage || 0) > 0 ? 1 : 0;
        if (aStarted !== bStarted) {
            return bStarted - aStarted;
        }

        const aHasGoal = a.readingGoalType ? 1 : 0;
        const bHasGoal = b.readingGoalType ? 1 : 0;
        if (aHasGoal !== bHasGoal) {
            return bHasGoal - aHasGoal;
        }

        return (b.currentPage || 0) - (a.currentPage || 0);
    });
};

const getStartOfWeek = (date: Date): Date => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfWeek = start.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + mondayOffset);
    return start;
};

const getGreetingKey = (): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'home.greeting.morning';
    if (hour >= 12 && hour < 17) return 'home.greeting.afternoon';
    if (hour >= 17 && hour < 22) return 'home.greeting.evening';
    return 'home.greeting.night';
};

type WeekDay = { date: string; pagesRead: number };

const buildWeekDays = (dailyActivity: DailyActivity[]): WeekDay[] => {
    const today = new Date();
    const monday = getStartOfWeek(today);
    const activityMap = new Map(dailyActivity.map((d) => [d.date, d.pagesRead]));

    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        const dateStr = day.toISOString().slice(0, 10);
        return { date: dateStr, pagesRead: activityMap.get(dateStr) || 0 };
    });
};

type LastActivity = {
    type: 'today' | 'yesterday' | 'none';
    pages?: number;
    title?: string;
};

const getLastActivity = (dailyActivity: DailyActivity[], books: Book[]): LastActivity => {
    if (dailyActivity.length === 0) return { type: 'none' };

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    const todayEntry = dailyActivity.find((d) => d.date === today);
    const yesterdayEntry = dailyActivity.find((d) => d.date === yesterday);

    const currentBook = books.find((b) => !b.completed && (b.currentPage || 0) > 0);
    const bookTitle = currentBook?.title || '';

    if (todayEntry && todayEntry.pagesRead > 0) {
        return { type: 'today', pages: todayEntry.pagesRead, title: bookTitle };
    }
    if (yesterdayEntry && yesterdayEntry.pagesRead > 0) {
        return { type: 'yesterday', pages: yesterdayEntry.pagesRead, title: bookTitle };
    }
    return { type: 'none' };
};

export const useHomeFocusData = () => {
    const { token, user } = useAuth();
    const { activeSession } = useReadingSessionContext();
    const goalsData = useGoalsData();

    const booksQuery = useQuery<Book[], Error>({
        queryKey: ['home', user?.email, 'books'],
        queryFn: async () => {
            const response = await booksApi.getAll(0, HOME_BOOK_PAGE_SIZE);
            return response?.content || [];
        },
        enabled: !!token,
    });

    const statsQuery = useQuery({
        queryKey: ['home', user?.email, 'stats'],
        queryFn: () => statsApi.getOverview(),
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
    });

    const sortedBooks = useMemo(() => sortBooksForFocus(booksQuery.data || []), [booksQuery.data]);

    const currentBook = useMemo(() => {
        if (sortedBooks.length === 0) {
            return null;
        }

        if (activeSession) {
            return sortedBooks.find((book) => book.id === activeSession.bookId) || null;
        }

        return sortedBooks.find((book) => !book.completed) || null;
    }, [activeSession, sortedBooks]);

    const queuedBooks = useMemo(() => (
        sortedBooks
            .filter((book) => !book.completed && book.id !== currentBook?.id)
            .slice(0, 3)
    ), [currentBook?.id, sortedBooks]);

    const completedBooksCount = useMemo(
        () => sortedBooks.filter((book) => book.completed).length,
        [sortedBooks]
    );

    const weekDays = useMemo(
        () => buildWeekDays(statsQuery.data?.dailyActivity || []),
        [statsQuery.data?.dailyActivity]
    );

    const lastActivity = useMemo(
        () => getLastActivity(statsQuery.data?.dailyActivity || [], sortedBooks),
        [statsQuery.data?.dailyActivity, sortedBooks]
    );

    const readingRhythm = useMemo(
        () => buildReadingRhythmSummary(statsQuery.data?.readingRhythm),
        [statsQuery.data?.readingRhythm]
    );

    const todaySuggestion = useMemo(
        () => buildTodaySuggestion(currentBook, statsQuery.data?.readingRhythm),
        [currentBook, statsQuery.data?.readingRhythm]
    );

    const resumeSuggestion = useMemo(
        () => buildResumeSuggestion(currentBook, queuedBooks),
        [currentBook, queuedBooks]
    );

    const greetingKey = getGreetingKey();

    return {
        activeSession,
        currentBook,
        queuedBooks,
        activeGoalBooks: goalsData.activeBooks.slice(0, 2),
        activeGoalCount: goalsData.activeBooks.length,
        streak: goalsData.streak,
        activeBooksCount: sortedBooks.filter((book) => !book.completed).length,
        completedBooksCount,
        weekDays,
        lastActivity,
        readingRhythm,
        todaySuggestion,
        resumeSuggestion,
        greetingKey,
        loading: booksQuery.isLoading || statsQuery.isLoading || goalsData.loading,
        isError: booksQuery.isError || statsQuery.isError || goalsData.isError,
        error: booksQuery.error?.message || statsQuery.error?.message || goalsData.error || null,
        refresh: async () => {
            await Promise.all([booksQuery.refetch(), statsQuery.refetch(), goalsData.refresh()]);
        },
    };
};
