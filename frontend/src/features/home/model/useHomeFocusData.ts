import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { useGoalsData } from '../../goals';
import { booksApi } from '../../library';
import { useReadingSessionContext } from '../../reading-session';
import { statsApi } from '../../stats';
import { formatLocalDate } from '../../../shared/lib/date';
import type { Book } from '../../../shared/types/books';
import type { DailyActivity } from '../../../shared/types/stats';
import {
    buildReadingRhythmSummary,
    buildResumeSuggestion,
    buildTodaySuggestion,
} from './homeInsights';

const EMPTY_BOOKS: Book[] = [];

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

export type WeekDay = { date: string; pagesRead: number };

const buildWeekDays = (dailyActivity: DailyActivity[]): WeekDay[] => {
    const today = new Date();
    const monday = getStartOfWeek(today);
    const activityMap = new Map(dailyActivity.map((d) => [d.date, d.pagesRead]));

    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        const dateStr = formatLocalDate(day);
        return { date: dateStr, pagesRead: activityMap.get(dateStr) || 0 };
    });
};

type LastActivity = {
    type: 'today' | 'yesterday' | 'none';
    pages?: number;
    title?: string;
};

const getLastActivity = (dailyActivity: DailyActivity[], currentBook: Book | null): LastActivity => {
    if (dailyActivity.length === 0) return { type: 'none' };

    const today = formatLocalDate(new Date());
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = formatLocalDate(yesterdayDate);

    const todayEntry = dailyActivity.find((d) => d.date === today);
    const yesterdayEntry = dailyActivity.find((d) => d.date === yesterday);

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
    const { email, user } = useAuth();
    const { activeSession } = useReadingSessionContext();
    const goalsData = useGoalsData();

    const focusQuery = useQuery({
        queryKey: ['home', user?.email, 'focus'],
        queryFn: () => booksApi.getFocus(),
        enabled: !!email,
    });

    const statsQuery = useQuery({
        queryKey: ['home', user?.email, 'stats'],
        queryFn: () => statsApi.getOverview(),
        enabled: !!email,
        staleTime: 5 * 60 * 1000,
    });

    const currentBook = focusQuery.data?.currentBook || null;
    const queuedBooks = focusQuery.data?.queuedBooks ?? EMPTY_BOOKS;
    const activeBooksCount = focusQuery.data?.activeBooksCount || 0;
    const completedBooksCount = focusQuery.data?.completedBooksCount || 0;

    const weekDays = useMemo(
        () => buildWeekDays(statsQuery.data?.dailyActivity || []),
        [statsQuery.data?.dailyActivity]
    );

    const lastActivity = useMemo(
        () => getLastActivity(statsQuery.data?.dailyActivity || [], currentBook),
        [currentBook, statsQuery.data?.dailyActivity]
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
        activeBooksCount,
        completedBooksCount,
        weekDays,
        lastActivity,
        readingRhythm,
        todaySuggestion,
        resumeSuggestion,
        greetingKey,
        loading: focusQuery.isLoading || statsQuery.isLoading || goalsData.loading,
        isError: focusQuery.isError || statsQuery.isError || goalsData.isError,
        error: focusQuery.error?.message || statsQuery.error?.message || goalsData.error || null,
        refresh: async () => {
            await Promise.all([focusQuery.refetch(), statsQuery.refetch(), goalsData.refresh()]);
        },
    };
};
