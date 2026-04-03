import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookSearch } from './useBookSearch';
import { discoveryApi } from '../../discovery';
import * as AuthModelModule from '../../auth/model';

const mockMutateAsync = vi.fn();

vi.mock('./useAddSearchResultToLibrary', () => ({
    useAddSearchResultToLibrary: () => ({
        mutateAsync: mockMutateAsync,
    }),
}));

vi.mock('../../discovery', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../discovery')>();
    return {
        ...actual,
        discoveryApi: {
            search: vi.fn(),
            logSearch: vi.fn(),
            getByRecentSearches: vi.fn(),
        },
    };
});

describe('useBookSearch', () => {
    let queryClient;

    const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false },
            },
        });

        vi.spyOn(AuthModelModule, 'useAuth').mockReturnValue({
            email: 'token',
            user: { email: 'reader@example.com' },
        });

        discoveryApi.getByRecentSearches.mockResolvedValue({ queries: ['Dune', 'Sapiens'], books: [] });
        discoveryApi.search.mockResolvedValue({ items: [{ title: 'Dune' }], totalItems: 1 });
        discoveryApi.logSearch.mockResolvedValue(null);
        mockMutateAsync.mockResolvedValue({ id: 1 });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        queryClient.clear();
    });

    it('loads recent searches for the authenticated user', async () => {
        const { result } = renderHook(() => useBookSearch(), { wrapper });

        await waitFor(() => {
            expect(result.current.recentSearches).toEqual(['Dune', 'Sapiens']);
        });

        expect(discoveryApi.getByRecentSearches).toHaveBeenCalledTimes(1);
    });

    it('falls back to an empty recent-search list when the API returns null', async () => {
        discoveryApi.getByRecentSearches.mockResolvedValue(null);

        const { result } = renderHook(() => useBookSearch(), { wrapper });

        await waitFor(() => {
            expect(result.current.recentSearches).toEqual([]);
        });
    });

    it('opens history only when recent searches exist and closes it on submit', async () => {
        const { result } = renderHook(() => useBookSearch(), { wrapper });

        await waitFor(() => {
            expect(result.current.recentSearches).toHaveLength(2);
        });

        act(() => {
            result.current.openHistory();
        });
        expect(result.current.isHistoryOpen).toBe(true);

        act(() => {
            result.current.searchBooks('  Dune Messiah  ');
        });

        await waitFor(() => {
            expect(discoveryApi.search).toHaveBeenCalledWith('Dune Messiah', 0, 36);
        });

        expect(result.current.isHistoryOpen).toBe(false);
        expect(result.current.query).toBe('Dune Messiah');
        expect(discoveryApi.logSearch).toHaveBeenCalledWith('Dune Messiah');
    });

    it('lets the user pick a recent search and applies it immediately', async () => {
        const { result } = renderHook(() => useBookSearch(), { wrapper });

        await waitFor(() => {
            expect(result.current.recentSearches).toContain('Dune');
        });

        act(() => {
            result.current.openHistory();
            result.current.selectRecentSearch('Dune');
        });

        await waitFor(() => {
            expect(discoveryApi.search).toHaveBeenCalledWith('Dune', 0, 36);
        });

        expect(result.current.query).toBe('Dune');
        expect(result.current.isHistoryOpen).toBe(false);
    });

    it('does not fetch or open history when the user is unauthenticated', async () => {
        vi.spyOn(AuthModelModule, 'useAuth').mockReturnValue({
            email: null,
            user: null,
        });

        const { result } = renderHook(() => useBookSearch(), { wrapper });

        await waitFor(() => {
            expect(result.current.recentSearches).toEqual([]);
        });

        act(() => {
            result.current.openHistory();
        });

        expect(discoveryApi.getByRecentSearches).not.toHaveBeenCalled();
        expect(result.current.isHistoryOpen).toBe(false);
    });

    it('loads the next page when more results are available', async () => {
        discoveryApi.search
            .mockResolvedValueOnce({
                items: Array.from({ length: 36 }, (_, index) => ({ title: `Book ${index}` })),
                totalItems: 72,
            })
            .mockResolvedValueOnce({
                items: [{ title: 'Book 36' }],
                totalItems: 72,
            });

        const { result } = renderHook(() => useBookSearch(), { wrapper });

        act(() => {
            result.current.searchBooks('Dune');
        });

        await waitFor(() => {
            expect(result.current.hasMore).toBe(true);
        });

        await act(async () => {
            await result.current.loadMore();
        });

        await waitFor(() => {
            expect(discoveryApi.search).toHaveBeenNthCalledWith(2, 'Dune', 36, 36);
        });
    });

    it('does not log the same search twice in a row for the same user', async () => {
        const { result } = renderHook(() => useBookSearch(), { wrapper });

        act(() => {
            result.current.searchBooks('Dune');
        });

        await waitFor(() => {
            expect(discoveryApi.logSearch).toHaveBeenCalledTimes(1);
        });

        act(() => {
            result.current.searchBooks('Dune');
        });

        await waitFor(() => {
            expect(discoveryApi.logSearch).toHaveBeenCalledTimes(1);
        });
    });

    it('closes history explicitly and clears active search term when the query becomes blank', async () => {
        const { result } = renderHook(() => useBookSearch(), { wrapper });

        await waitFor(() => {
            expect(result.current.recentSearches).toHaveLength(2);
        });

        act(() => {
            result.current.openHistory();
        });
        expect(result.current.isHistoryOpen).toBe(true);

        act(() => {
            result.current.closeHistory();
            result.current.searchBooks('Dune');
        });

        await waitFor(() => {
            expect(discoveryApi.search).toHaveBeenCalledWith('Dune', 0, 36);
        });

        act(() => {
            result.current.setQuery('   ');
        });

        await waitFor(() => {
            expect(result.current.results).toEqual([]);
            expect(result.current.hasMore).toBe(false);
        });

        expect(result.current.isHistoryOpen).toBe(false);
    });

    it('does not call the provider search when the submitted query is blank', async () => {
        const { result } = renderHook(() => useBookSearch(), { wrapper });

        act(() => {
            result.current.searchBooks('   ');
        });

        await waitFor(() => {
            expect(result.current.results).toEqual([]);
        });

        expect(discoveryApi.search).not.toHaveBeenCalled();
        expect(result.current.hasMore).toBe(false);
    });

    it('falls back to an empty result when the search API returns null', async () => {
        discoveryApi.search.mockResolvedValueOnce(null);

        const { result } = renderHook(() => useBookSearch(), { wrapper });

        act(() => {
            result.current.searchBooks('Dune');
        });

        await waitFor(() => {
            expect(result.current.results).toEqual([]);
            expect(result.current.hasMore).toBe(false);
        });
    });

    it('surfaces provider errors through the error field', async () => {
        discoveryApi.search.mockRejectedValueOnce(new Error('Search failed'));

        const { result } = renderHook(() => useBookSearch(), { wrapper });

        act(() => {
            result.current.searchBooks('Dune');
        });

        await waitFor(() => {
            expect(result.current.error).toBe('Search failed');
        });
    });
});
