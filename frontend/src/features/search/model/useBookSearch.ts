import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '../../auth/model';
import { useInfiniteQuery } from '@tanstack/react-query';
import { discoveryApi } from '../../discovery/api';
import { useAddSearchResultToLibrary } from './useAddSearchResultToLibrary.jsx';
import type { DiscoverySearchResult } from '../../../shared/types/discovery';

const PAGE_SIZE = 36;
const MIN_QUERY_LENGTH = 3;
const EMPTY_SEARCH_RESULT: DiscoverySearchResult = { items: [], totalItems: 0 };

export const useBookSearch = () => {
    const [query, setQuery] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const { token, user } = useAuth();

    const lastLoggedQuery = useRef('');
    const lastLogRequestId = useRef(0);

    useEffect(() => {
        const trimmed = searchTerm.trim();
        if (
            trimmed.length >= MIN_QUERY_LENGTH
            && trimmed.toLowerCase() !== lastLoggedQuery.current.toLowerCase()
            && token
        ) {
            const requestId = ++lastLogRequestId.current;
            discoveryApi.logSearch(trimmed)
                .then(() => {
                    if (requestId === lastLogRequestId.current) {
                        lastLoggedQuery.current = trimmed;
                    }
                })
                .catch(() => {
                    // Silently ignore logging errors.
                });
        }
    }, [searchTerm, token]);

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

    const searchBooks = (e?: FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        setSearchTerm(query.trim());
    };

    return {
        query,
        setQuery,
        results,
        error: error ? error.message : null,
        hasMore: hasNextPage,
        isLoading,
        isFetchingNextPage,
        searchBooks,
        loadMore: fetchNextPage,
        addBookToLibrary: addBookMutation.mutateAsync,
    };
};
