import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { discoveryApi } from '../../discovery';
import { useAddSearchResultToLibrary } from './useAddSearchResultToLibrary';
import type { DiscoverySearchResult, DiscoverySearchSection } from '../../../shared/types/discovery';

const PAGE_SIZE = 36;
const MIN_QUERY_LENGTH = 3;
const EMPTY_SEARCH_RESULT: DiscoverySearchResult = { items: [], totalItems: 0 };
const EMPTY_SEARCH_SECTION: DiscoverySearchSection = { queries: [], books: [] };

export const useBookSearch = () => {
    const [query, setQuery] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const { email, user } = useAuth();
    const queryClient = useQueryClient();

    const lastLoggedQuery = useRef('');
    const lastLogRequestId = useRef(0);

    const { data: recentSearchData } = useQuery<DiscoverySearchSection, Error>({
        queryKey: ['recent-searches', user?.email],
        queryFn: async () => (await discoveryApi.getByRecentSearches()) || EMPTY_SEARCH_SECTION,
        enabled: !!email,
        staleTime: 60_000,
    });

    const recentSearches = recentSearchData?.queries || [];

    useEffect(() => {
        const trimmed = searchTerm.trim();
        if (
            trimmed.length >= MIN_QUERY_LENGTH
            && trimmed.toLowerCase() !== lastLoggedQuery.current.toLowerCase()
            && email
        ) {
            const requestId = ++lastLogRequestId.current;
            discoveryApi.logSearch(trimmed)
                .then(() => {
                    if (requestId === lastLogRequestId.current) {
                        lastLoggedQuery.current = trimmed;
                    }
                    void queryClient.invalidateQueries({ queryKey: ['recent-searches', user?.email] });
                })
                .catch(() => {
                    // Silently ignore logging errors.
                });
        }
    }, [queryClient, searchTerm, email, user?.email]);

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery<DiscoverySearchResult, Error>({
        queryKey: ['books', user?.email, searchTerm],
        queryFn: async ({ pageParam = 0 }) => {
            if (!searchTerm.trim()) return EMPTY_SEARCH_RESULT;
            return (await discoveryApi.search(searchTerm.trim(), pageParam as number, PAGE_SIZE)) || EMPTY_SEARCH_RESULT;
        },
        getNextPageParam: (lastPage, allPages) => {
            if (!lastPage.items || lastPage.items.length === 0) return undefined;
            const nextStart = allPages.length * PAGE_SIZE;
            if (nextStart >= (lastPage.totalItems || 0)) return undefined;
            return nextStart;
        },
        enabled: !!searchTerm.trim(),
        initialPageParam: 0,
    });

    const results = data ? data.pages.flatMap((page) => page.items || []) : [];
    const addBookMutation = useAddSearchResultToLibrary();

    useEffect(() => {
        if (!query.trim()) {
            setSearchTerm('');
        }
    }, [query]);

    const closeHistory = useCallback(() => {
        setIsHistoryOpen(false);
    }, []);

    const openHistory = useCallback(() => {
        if (recentSearches.length > 0) {
            setIsHistoryOpen(true);
        }
    }, [recentSearches.length]);

    const searchBooks = useCallback((nextQuery?: string) => {
        const trimmedQuery = (nextQuery ?? query).trim();
        setQuery(trimmedQuery);
        setSearchTerm(trimmedQuery);
        setIsHistoryOpen(false);
    }, [query]);

    const selectRecentSearch = useCallback((nextQuery: string) => {
        searchBooks(nextQuery);
    }, [searchBooks]);

    return {
        query,
        setQuery,
        recentSearches,
        isHistoryOpen,
        results,
        error: error ? error.message : null,
        hasMore: hasNextPage,
        isLoading,
        isFetchingNextPage,
        searchBooks,
        openHistory,
        closeHistory,
        selectRecentSearch,
        loadMore: fetchNextPage,
        addBookToLibrary: addBookMutation.mutateAsync,
    };
};
