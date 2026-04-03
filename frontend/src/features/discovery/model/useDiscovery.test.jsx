import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDiscovery } from './useDiscovery';
import * as AuthContextModule from '../../auth/model/AuthContext';

vi.mock('../api/discoveryApi', () => ({
    default: {
        getAll: vi.fn(),
    },
}));

import discoveryApi from '../api/discoveryApi';

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

describe('useDiscovery', () => {
    let queryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => { });

        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
            email: 'test-token',
            user: { email: 'test@example.com' }
        });

        queryClient = createTestQueryClient();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        queryClient.clear();
    });

    const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    it('should start in loading state', () => {
        discoveryApi.getAll.mockReturnValue(new Promise(() => { })); // never resolves
        const { result } = renderHook(() => useDiscovery(), { wrapper });
        expect(result.current.loading).toBe(true);
    });

    it('should fetch data on mount and set data', async () => {
        discoveryApi.getAll.mockResolvedValue({
            byAuthor: { authors: ['Author1'], books: [{ isbn: '123', coverUrl: 'http://img.jpg' }] },
            byCategory: { categories: ['Fiction'], books: [{ isbn: '456', coverUrl: 'http://img2.jpg' }] },
            bySearch: { queries: ['test'], books: [{ isbn: '789', coverUrl: 'http://img3.jpg' }] },
        });

        const { result } = renderHook(() => useDiscovery(), { wrapper });

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data.byAuthor.authors).toEqual(['Author1']);
        expect(result.current.data.byAuthor.books).toHaveLength(1);
        expect(result.current.data.byCategory.categories).toEqual(['Fiction']);
        expect(result.current.data.bySearch.queries).toEqual(['test']);
    });

    it('should filter out books without isbn', async () => {
        discoveryApi.getAll.mockResolvedValue({
            byAuthor: {
                authors: ['A'],
                books: [
                    { isbn: '123', coverUrl: 'http://img.jpg' },
                    { isbn: null, coverUrl: 'http://img2.jpg' }, // no isbn
                ],
            },
            byCategory: { categories: [], books: [] },
            bySearch: { queries: [], books: [] },
        });

        const { result } = renderHook(() => useDiscovery(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data.byAuthor.books).toHaveLength(1);
    });

    it('should filter out books without coverUrl or empty coverUrl', async () => {
        discoveryApi.getAll.mockResolvedValue({
            byAuthor: { authors: [], books: [{ isbn: '1', coverUrl: '' }, { isbn: '2', coverUrl: '   ' }] },
            byCategory: { categories: [], books: [{ isbn: '3', coverUrl: null }] },
            bySearch: { queries: [], books: [{ isbn: '4', coverUrl: 'http://ok.jpg' }] },
        });

        const { result } = renderHook(() => useDiscovery(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data.byAuthor.books).toHaveLength(0);
        expect(result.current.data.byCategory.books).toHaveLength(0);
        expect(result.current.data.bySearch.books).toHaveLength(1);
    });

    it('should handle missing nested properties', async () => {
        discoveryApi.getAll.mockResolvedValue({}); // No byAuthor, byCategory, bySearch

        const { result } = renderHook(() => useDiscovery(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.data.byAuthor.authors).toEqual([]);
        expect(result.current.data.byAuthor.books).toEqual([]);
    });

    it('should set error on API failure', async () => {
        discoveryApi.getAll.mockRejectedValue(new Error('Server error'));

        const { result } = renderHook(() => useDiscovery(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Server error');
    });

    it('should not fetch if token is missing', async () => {
        vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({ email: null, user: null });

        const { result } = renderHook(() => useDiscovery(), { wrapper });

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(discoveryApi.getAll).not.toHaveBeenCalled();
    });

    it('refresh should re-fetch data', async () => {
        discoveryApi.getAll.mockResolvedValue({
            byAuthor: { authors: [], books: [] },
            byCategory: { categories: [], books: [] },
            bySearch: { queries: [], books: [] },
        });

        const { result } = renderHook(() => useDiscovery(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(discoveryApi.getAll).toHaveBeenCalledTimes(1);

        result.current.refresh();

        await waitFor(() => expect(discoveryApi.getAll).toHaveBeenCalledTimes(2));
    });
});
