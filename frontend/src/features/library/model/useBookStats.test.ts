import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { useBookStats } from './useBookStats';
import type { Book } from '../../../shared/types/books';
import type { ReadingSession } from '../../../shared/types/sessions';

// ── External dependency mocks ─────────────────────────────────────────────────

vi.mock('../../auth', () => ({
    useAuth: () => ({ email: 'user@example.com' }),
}));

const mockGetById = vi.fn();
vi.mock('../api', () => ({
    booksApi: {
        getById: (...args: unknown[]) => mockGetById(...args),
    },
}));

const mockGetByBookId = vi.fn();
vi.mock('../../reading-session', () => ({
    sessionsApi: {
        getByBookId: (...args: unknown[]) => mockGetByBookId(...args),
    },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const buildBook = (overrides: Partial<Book> = {}): Book => ({
    id: 1,
    isbn: null,
    title: 'Dune',
    authorName: 'Frank Herbert',
    publishYear: 1965,
    coverUrl: null,
    pageCount: 412,
    currentPage: 100,
    startDate: null,
    completed: false,
    readingGoalType: null,
    readingGoalPages: null,
    readingGoalProgress: null,
    categories: [],
    ...overrides,
});

const buildSession = (overrides: Partial<ReadingSession> = {}): ReadingSession => ({
    id: 1,
    bookId: 1,
    startTime: '2026-04-01T10:00:00Z',
    endTime: '2026-04-01T11:00:00Z',
    status: 'COMPLETED',
    startPage: 80,
    endPage: 100,
    pagesRead: 20,
    pausedMillis: null,
    pausedAt: null,
    ...overrides,
});

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

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useBookStats', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initial / loading state', () => {
        it('returns loading=true and empty defaults before data resolves', () => {
            // Never-resolving promises keep the queries in a loading state.
            mockGetById.mockReturnValue(new Promise(() => {}));
            mockGetByBookId.mockReturnValue(new Promise(() => {}));

            const client = createClient();
            const { result } = renderHook(() => useBookStats('1'), {
                wrapper: createWrapper(client),
            });

            expect(result.current.loading).toBe(true);
            expect(result.current.book).toBeNull();
            expect(result.current.sessions).toEqual([]);
            expect(result.current.error).toBeFalsy();
        });
    });

    describe('when bookId is undefined', () => {
        it('does not trigger any API calls and keeps loading false', () => {
            const client = createClient();
            const { result } = renderHook(() => useBookStats(undefined), {
                wrapper: createWrapper(client),
            });

            // Queries are disabled, so loading stays false and no API is called.
            expect(result.current.loading).toBe(false);
            expect(mockGetById).not.toHaveBeenCalled();
            expect(mockGetByBookId).not.toHaveBeenCalled();
        });
    });

    describe('successful data fetch', () => {
        it('returns the book and sessions after both queries resolve', async () => {
            const book = buildBook({ id: 7, title: 'Foundation' });
            const sessions = [buildSession({ id: 10, bookId: 7 })];

            mockGetById.mockResolvedValue(book);
            mockGetByBookId.mockResolvedValue(sessions);

            const client = createClient();
            const { result } = renderHook(() => useBookStats('7'), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.book).toEqual(book);
            expect(result.current.sessions).toEqual(sessions);
            expect(result.current.error).toBeFalsy();
        });

        it('passes the numeric bookId to booksApi.getById', async () => {
            mockGetById.mockResolvedValue(buildBook());
            mockGetByBookId.mockResolvedValue([]);

            const client = createClient();
            const { result } = renderHook(() => useBookStats('42'), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(mockGetById).toHaveBeenCalledWith(42);
        });

        it('passes the numeric bookId to sessionsApi.getByBookId', async () => {
            mockGetById.mockResolvedValue(buildBook());
            mockGetByBookId.mockResolvedValue([]);

            const client = createClient();
            const { result } = renderHook(() => useBookStats('42'), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(mockGetByBookId).toHaveBeenCalledWith(42);
        });

        it('defaults sessions to an empty array when the API returns null/undefined', async () => {
            mockGetById.mockResolvedValue(buildBook());
            // Simulate an API that returns null instead of an array
            mockGetByBookId.mockResolvedValue(null);

            const client = createClient();
            const { result } = renderHook(() => useBookStats('1'), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.sessions).toEqual([]);
        });

        it('exposes a refetch function that can be called without throwing', async () => {
            mockGetById.mockResolvedValue(buildBook());
            mockGetByBookId.mockResolvedValue([]);

            const client = createClient();
            const { result } = renderHook(() => useBookStats('1'), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            // Calling refetch should not throw
            await expect(result.current.refetch()).resolves.not.toThrow();
        });
    });

    describe('error states', () => {
        it('exposes the error when the book query fails', async () => {
            const bookError = new Error('Book not found');
            mockGetById.mockRejectedValue(bookError);
            mockGetByBookId.mockResolvedValue([]);

            const client = createClient();
            const { result } = renderHook(() => useBookStats('99'), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBeTruthy();
            expect(result.current.book).toBeNull();
        });

        it('exposes the error when the sessions query fails', async () => {
            const sessionsError = new Error('Sessions unavailable');
            mockGetById.mockResolvedValue(buildBook());
            mockGetByBookId.mockRejectedValue(sessionsError);

            const client = createClient();
            const { result } = renderHook(() => useBookStats('1'), {
                wrapper: createWrapper(client),
            });

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBeTruthy();
            expect(result.current.sessions).toEqual([]);
        });

        it('is still loading when one query resolves but the other is pending', async () => {
            // Book resolves immediately; sessions never resolves.
            mockGetById.mockResolvedValue(buildBook());
            mockGetByBookId.mockReturnValue(new Promise(() => {}));

            const client = createClient();
            const { result } = renderHook(() => useBookStats('1'), {
                wrapper: createWrapper(client),
            });

            // Give the book query time to settle without the sessions query resolving.
            await waitFor(() => expect(result.current.book).not.toBeNull());

            expect(result.current.loading).toBe(true);
        });
    });
});
