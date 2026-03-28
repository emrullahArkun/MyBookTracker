import type { Book } from '../../../shared/types/books';
import type { ReadingRhythm } from '../../../shared/types/stats';

const MIN_DAILY_PAGES = 8;
const MAX_DAILY_PAGES = 30;
const DEFAULT_DAILY_PAGES = 12;

export type TodaySuggestion =
    | {
        kind: 'continue';
        title: string;
        suggestedPages: number;
        targetPage: number | null;
        remainingPages: number | null;
    }
    | {
        kind: 'finish';
        title: string;
        suggestedPages: number;
        remainingPages: number;
    }
    | {
        kind: 'empty';
    };

export type ResumeSuggestion =
    | {
        kind: 'current';
        title: string;
        currentPage: number;
    }
    | {
        kind: 'queued';
        title: string;
    }
    | {
        kind: 'empty';
    };

export type ReadingRhythmSummary = {
    enoughData: boolean;
    hasAnySessions: boolean;
    preferredTimeOfDay: ReadingRhythm['preferredTimeOfDay'];
    preferredSessionLength: ReadingRhythm['preferredSessionLength'];
    activeDaysLast14: number;
    sessionsLast14: number;
    averagePagesPerSession: number;
    averageMinutesPerSession: number;
    consistency: 'steady' | 'growing' | 'light' | 'empty';
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);

const getSuggestedPages = (readingRhythm: ReadingRhythm | null | undefined): number => {
    const averagePages = readingRhythm?.averagePagesPerSession || DEFAULT_DAILY_PAGES;
    return clamp(averagePages, MIN_DAILY_PAGES, MAX_DAILY_PAGES);
};

export const buildTodaySuggestion = (
    currentBook: Book | null,
    readingRhythm: ReadingRhythm | null | undefined
): TodaySuggestion => {
    if (!currentBook) {
        return { kind: 'empty' };
    }

    const currentPage = currentBook.currentPage || 0;
    const suggestedPages = getSuggestedPages(readingRhythm);
    const remainingPages = currentBook.pageCount
        ? Math.max(currentBook.pageCount - currentPage, 0)
        : null;

    if (remainingPages !== null && remainingPages > 0 && remainingPages <= suggestedPages + 4) {
        return {
            kind: 'finish',
            title: currentBook.title,
            suggestedPages: remainingPages,
            remainingPages,
        };
    }

    return {
        kind: 'continue',
        title: currentBook.title,
        suggestedPages: remainingPages === null ? suggestedPages : Math.min(remainingPages, suggestedPages),
        targetPage: currentPage + (remainingPages === null ? suggestedPages : Math.min(remainingPages, suggestedPages)),
        remainingPages,
    };
};

export const buildResumeSuggestion = (currentBook: Book | null, queuedBooks: Book[]): ResumeSuggestion => {
    if (currentBook && (currentBook.currentPage || 0) > 0) {
        return {
            kind: 'current',
            title: currentBook.title,
            currentPage: currentBook.currentPage || 0,
        };
    }

    const nextBook = queuedBooks[0];
    if (nextBook) {
        return {
            kind: 'queued',
            title: nextBook.title,
        };
    }

    return { kind: 'empty' };
};

export const buildReadingRhythmSummary = (
    readingRhythm: ReadingRhythm | null | undefined
): ReadingRhythmSummary => {
    const sessionsLast14 = readingRhythm?.sessionsLast14 || 0;
    const activeDaysLast14 = readingRhythm?.activeDaysLast14 || 0;

    let consistency: ReadingRhythmSummary['consistency'] = 'empty';
    if (sessionsLast14 > 0) {
        if (activeDaysLast14 >= 5) {
            consistency = 'steady';
        } else if (activeDaysLast14 >= 3) {
            consistency = 'growing';
        } else {
            consistency = 'light';
        }
    }

    return {
        enoughData: Boolean(readingRhythm?.enoughData),
        hasAnySessions: sessionsLast14 > 0,
        preferredTimeOfDay: readingRhythm?.preferredTimeOfDay || 'UNKNOWN',
        preferredSessionLength: readingRhythm?.preferredSessionLength || 'UNKNOWN',
        activeDaysLast14,
        sessionsLast14,
        averagePagesPerSession: readingRhythm?.averagePagesPerSession || 0,
        averageMinutesPerSession: readingRhythm?.averageMinutesPerSession || 0,
        consistency,
    };
};
