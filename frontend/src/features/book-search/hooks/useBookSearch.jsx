import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { booksApi } from '../../books/api';
import { useAddBookToLibrary } from '../../books/hooks/useAddBookToLibrary';
import discoveryApi from '../../discovery/api/discoveryApi';

// Constants for debounced logging
const LOG_DEBOUNCE_MS = 2000; // Wait 2 seconds after last keystroke
const MIN_QUERY_LENGTH = 3;  // Minimum 3 characters to log

export const useBookSearch = () => {
    const [query, setQuery] = useState('');
    const [searchTerm, setSearchTerm] = useState(''); // Only updates on Enter/button click
    const { token, user } = useAuth();

    // Track last logged query to prevent duplicates
    const lastLoggedQuery = useRef('');
    const logTimeoutRef = useRef(null);

    // Debounced search logging - logs after user stops typing for 2 seconds
    useEffect(() => {
        if (logTimeoutRef.current) {
            clearTimeout(logTimeoutRef.current);
        }

        const trimmedQuery = query.trim();

        if (trimmedQuery.length >= MIN_QUERY_LENGTH &&
            trimmedQuery.toLowerCase() !== lastLoggedQuery.current.toLowerCase() &&
            token) {

            logTimeoutRef.current = setTimeout(() => {
                discoveryApi.logSearch(trimmedQuery).then(() => {
                    lastLoggedQuery.current = trimmedQuery;
                }).catch(() => {
                    // Silently ignore logging errors
                });
            }, LOG_DEBOUNCE_MS);
        }

        return () => {
            if (logTimeoutRef.current) {
                clearTimeout(logTimeoutRef.current);
            }
        };
    }, [query, token]);

    // Fetch owned ISBNs to check duplicates
    const { data: ownedIsbns } = useQuery({
        queryKey: ['ownedIsbns', user?.email],
        queryFn: async () => {
            if (!token) return [];
            const response = await booksApi.getOwnedIsbns();
            if (response) return response;
            return [];
        },
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });

    const ownedIsbnsSet = useMemo(
        () => new Set((ownedIsbns || []).map(isbn => isbn.replace(/-/g, ''))),
        [ownedIsbns]
    );

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['books', searchTerm],
        queryFn: async ({ pageParam = 0 }) => {
            if (!searchTerm.trim()) return { items: [], totalItems: 0 };
            const finalQuery = encodeURIComponent(searchTerm.trim());
            // This is a restricted browser API key, safe for client-side use.
            // It is scoped to the Google Books API and restricted by HTTP referrer.
            const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
            const keyParam = apiKey ? `&key=${apiKey}` : '';
            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${finalQuery}&startIndex=${pageParam}&maxResults=36${keyParam}`);
            if (!response.ok) throw new Error('Failed to fetch from Google Books');
            return response.json();
        },
        getNextPageParam: (lastPage, allPages) => {
            const loadedItems = allPages.flatMap(p => p.items || []).length;
            if (loadedItems < (lastPage.totalItems || 0)) {
                return loadedItems;
            }
            return undefined;
        },
        enabled: !!searchTerm.trim(),
        initialPageParam: 0
    });

    const allRawItems = data ? data.pages.flatMap(page => page.items || []) : [];
    // Filter out items without IDs or volumeInfo, and deduplicate by ID
    const results = Array.from(
        new Map(
            allRawItems
                .filter(item => item.id && item.volumeInfo)
                .map(item => [item.id, item])
        ).values()
    );

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
        loading: isLoading || isFetching,
        searchBooks,
        loadMore: fetchNextPage,
        addBookToLibrary: addBookMutation.mutateAsync,
        ownedIsbns: ownedIsbnsSet
    };
};
