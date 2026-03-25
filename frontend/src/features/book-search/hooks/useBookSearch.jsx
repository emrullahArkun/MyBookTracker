import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useAddBookToLibrary } from '../../books/hooks/useAddBookToLibrary';
import discoveryApi from '../../discovery/api/discoveryApi';

const PAGE_SIZE = 36;
const MIN_QUERY_LENGTH = 3;

export const useBookSearch = () => {
    const [query, setQuery] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Only updates on Enter/button click
    const { token } = useAuth();

    // Track last logged query to prevent duplicates
    const lastLoggedQuery = useRef('');

    // Log search when user actively submits (searchTerm changes)
    useEffect(() => {
        const trimmed = searchTerm.trim();
        if (trimmed.length >= MIN_QUERY_LENGTH &&
            trimmed.toLowerCase() !== lastLoggedQuery.current.toLowerCase() &&
            token) {
            discoveryApi.logSearch(trimmed).then(() => {
                lastLoggedQuery.current = trimmed;
            }).catch(() => {
                // Silently ignore logging errors
            });
        }
    }, [searchTerm, token]);

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['books', searchTerm],
        queryFn: async ({ pageParam = 0 }) => {
            if (!searchTerm.trim()) return { items: [], totalItems: 0 };
            return discoveryApi.search(searchTerm.trim(), pageParam, PAGE_SIZE);
        },
        getNextPageParam: (lastPage, allPages) => {
            // Stop if last page returned no items (all filtered or truly exhausted)
            if (!lastPage.items || lastPage.items.length === 0) return undefined;
            // Use raw page offset for Google API (page count × page size)
            const nextStart = allPages.length * PAGE_SIZE;
            if (nextStart >= (lastPage.totalItems || 0)) return undefined;
            return nextStart;
        },
        enabled: !!searchTerm.trim(),
        initialPageParam: 0
    });

    const results = data ? data.pages.flatMap(page => page.items || []) : [];

    const addBookMutation = useAddBookToLibrary();

    // Clear results when input is emptied
    useEffect(() => {
        if (!query.trim()) {
            setSearchTerm('');
        }
    }, [query]);

    const searchBooks = (e) => {
        if (e) e.preventDefault();
        setSearchTerm(query.trim());
    };

    return {
        query, setQuery,
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
