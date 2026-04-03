import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { formatTime, formatShortDate, useStatsOverviewData } from './useStatsOverviewData';
import type { StatsOverview } from '../../../shared/types/stats';

// ── External dependency mocks ─────────────────────────────────────────────────

vi.mock('../../auth', () => ({
    useAuth: vi.fn(() => ({ email: 'test@test.com', user: { email: 'test@test.com' } })),
}));

const mockGetOverview = vi.fn();
vi.mock('../api/statsApi', () => ({
    default: { getOverview: (...args: unknown[]) => mockGetOverview(...args) },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Create a fresh QueryClient that does not retry on errors, to speed up tests. */
const createClient = () =>
    new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

/** Wrapper factory that provides a QueryClientProvider for each test. */
const createWrapper = (client: QueryClient) =>
    ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client }, children);

/**
 * Build a minimal StatsOverview object.
 * All fields that the hook doesn't reference directly are set to empty/zero
 * defaults so tests only need to override the fields they care about.
 */
const buildStats = (overrides: Partial<StatsOverview> = {}): StatsOverview => ({
    totalBooks: 0,
    completedBooks: 0,
    totalPagesRead: 0,
    totalReadingMinutes: 0,
    currentStreak: 0,
    longestStreak: 0,
    genreDistribution: [],
    dailyActivity: [],
    readingRhythm: null,
    ...overrides,
});

// ── Utility tests ─────────────────────────────────────────────────────────────

describe('useStatsOverviewData utilities', () => {
    describe('formatTime', () => {
        it('should format minutes less than 60 as minutes only', () => {
            expect(formatTime(0)).toBe('0m');
            expect(formatTime(30)).toBe('30m');
            expect(formatTime(59)).toBe('59m');
        });

        it('should format exact hours without minutes', () => {
            expect(formatTime(60)).toBe('1h');
            expect(formatTime(120)).toBe('2h');
        });

        it('should format hours and minutes', () => {
            expect(formatTime(90)).toBe('1h 30m');
            expect(formatTime(150)).toBe('2h 30m');
            expect(formatTime(61)).toBe('1h 1m');
        });
    });

    describe('formatShortDate', () => {
        it('should format a date string with day and short month', () => {
            const result = formatShortDate('2026-03-15', 'en');
            expect(result).toContain('15');
            expect(result).toContain('Mar');
        });

        it('should respect locale', () => {
            const result = formatShortDate('2026-01-05', 'de');
            expect(result).toContain('5');
            expect(result).toContain('Jan');
        });
    });
});

// ── Hook tests ────────────────────────────────────────────────────────────────

describe('useStatsOverviewData hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('loading state', () => {
        it('returns loading=true initially before the query resolves', () => {
            // A never-resolving promise keeps the query in the loading state.
            mockGetOverview.mockReturnValue(new Promise(() => {}));

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            expect(result.current.loading).toBe(true);
            expect(result.current.stats).toBeUndefined();
            expect(result.current.isError).toBe(false);
        });
    });

    describe('successful data fetch', () => {
        it('returns stats data after the query resolves', async () => {
            const stats = buildStats({ totalBooks: 10, completedBooks: 5, totalPagesRead: 800 });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.stats).toEqual(stats);
            expect(result.current.isError).toBe(false);
        });

        it('exposes a refetch function that can be called without throwing', async () => {
            mockGetOverview.mockResolvedValue(buildStats());

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            await expect(result.current.refetch()).resolves.not.toThrow();
        });
    });

    describe('weekStats computation', () => {
        it('counts only days with pagesRead > 0 as reading days', async () => {
            // 2026-04-03 is a Friday. The current ISO week (Mon–Sun) starts on 2026-03-30.
            // Using mid-week dates to stay safely within the current week.
            const stats = buildStats({
                dailyActivity: [
                    { date: '2026-03-31', pagesRead: 20 }, // Tuesday – counts
                    { date: '2026-04-01', pagesRead: 0 },  // Wednesday – zero, should NOT count
                    { date: '2026-04-02', pagesRead: 15 }, // Thursday – counts
                ],
            });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.weekStats).not.toBeNull();
            expect(result.current.weekStats!.readingDaysThisWeek).toBe(2);
        });

        it('sums pagesRead for the current week', async () => {
            const stats = buildStats({
                dailyActivity: [
                    { date: '2026-03-31', pagesRead: 20 },
                    { date: '2026-04-02', pagesRead: 15 },
                ],
            });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.weekStats!.pagesThisWeek).toBe(35);
        });

        it('computes averageReadingDay as round(pagesThisWeek / readingDaysThisWeek)', async () => {
            const stats = buildStats({
                dailyActivity: [
                    { date: '2026-03-31', pagesRead: 20 },
                    { date: '2026-04-02', pagesRead: 15 },
                ],
            });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            // 35 pages / 2 days = 17.5 → rounds to 18
            expect(result.current.weekStats!.averageReadingDay).toBe(18);
        });

        it('sets averageReadingDay to 0 when there are no reading days this week', async () => {
            const stats = buildStats({
                dailyActivity: [
                    { date: '2026-04-01', pagesRead: 0 },
                ],
            });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.weekStats!.averageReadingDay).toBe(0);
        });

        it('ignores daily activity entries that fall outside the current week', async () => {
            const stats = buildStats({
                dailyActivity: [
                    { date: '2026-03-20', pagesRead: 100 }, // previous week – must be ignored
                    { date: '2026-04-01', pagesRead: 10 },  // current week – counts
                ],
            });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.weekStats!.pagesThisWeek).toBe(10);
            expect(result.current.weekStats!.readingDaysThisWeek).toBe(1);
        });

        it('returns weekStats=null before the query resolves', () => {
            mockGetOverview.mockReturnValue(new Promise(() => {}));

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            expect(result.current.weekStats).toBeNull();
        });
    });

    describe('bestRecentDay computation', () => {
        it('returns the entry with the highest pagesRead', async () => {
            const stats = buildStats({
                dailyActivity: [
                    { date: '2026-04-01', pagesRead: 10 },
                    { date: '2026-04-02', pagesRead: 55 },
                    { date: '2026-04-03', pagesRead: 30 },
                ],
            });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.bestRecentDay).toEqual({ date: '2026-04-02', pagesRead: 55 });
        });

        it('returns null when all entries have pagesRead = 0', async () => {
            const stats = buildStats({
                dailyActivity: [
                    { date: '2026-04-01', pagesRead: 0 },
                    { date: '2026-04-02', pagesRead: 0 },
                ],
            });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.bestRecentDay).toBeNull();
        });

        it('returns null when dailyActivity is empty', async () => {
            const stats = buildStats({ dailyActivity: [] });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.bestRecentDay).toBeNull();
        });

        it('returns bestRecentDay=null before the query resolves', () => {
            mockGetOverview.mockReturnValue(new Promise(() => {}));

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            expect(result.current.bestRecentDay).toBeNull();
        });
    });

    describe('completedRatio computation', () => {
        it('computes the ratio as round((completedBooks / totalBooks) * 100)', async () => {
            const stats = buildStats({ totalBooks: 4, completedBooks: 2 });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.completedRatio).toBe(50);
        });

        it('rounds the ratio to the nearest integer', async () => {
            // 1 out of 3 = 33.33… → rounds to 33
            const stats = buildStats({ totalBooks: 3, completedBooks: 1 });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.completedRatio).toBe(33);
        });

        it('returns 100 when all books are completed', async () => {
            const stats = buildStats({ totalBooks: 5, completedBooks: 5 });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.completedRatio).toBe(100);
        });

        it('returns 0 when totalBooks is 0 (avoids division by zero)', async () => {
            const stats = buildStats({ totalBooks: 0, completedBooks: 0 });
            mockGetOverview.mockResolvedValue(stats);

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.completedRatio).toBe(0);
        });

        it('returns 0 before the query resolves', () => {
            mockGetOverview.mockReturnValue(new Promise(() => {}));

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            expect(result.current.completedRatio).toBe(0);
        });
    });

    describe('error state', () => {
        it('returns isError=true when the query fails', async () => {
            mockGetOverview.mockRejectedValue(new Error('Network error'));

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.isError).toBe(true);
            expect(result.current.stats).toBeUndefined();
        });

        it('keeps weekStats, bestRecentDay, and completedRatio at their defaults when the query fails', async () => {
            mockGetOverview.mockRejectedValue(new Error('Network error'));

            const client = createClient();
            const { result } = renderHook(() => useStatsOverviewData(), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.weekStats).toBeNull();
            expect(result.current.bestRecentDay).toBeNull();
            expect(result.current.completedRatio).toBe(0);
        });
    });
});
