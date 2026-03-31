import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/model';
import { booksApi } from '../api';
import type { ApiError } from '../../../shared/types/http';
import type { Book, LibrarySectionKey, PaginatedResponse } from '../../../shared/types/books';

const SECTION_PAGE_SIZE = 4;
const EMPTY_PAGE: PaginatedResponse<Book> = {
    content: [],
    totalPages: 0,
    totalElements: 0,
    size: SECTION_PAGE_SIZE,
    number: 0,
};

type SectionPages = Record<LibrarySectionKey, number>;

const getSectionQueryKey = (token: string | null, section: LibrarySectionKey, page: number) => (
    ['myBooksSection', token, section, page] as const
);

const useSectionQuery = (token: string | null, section: LibrarySectionKey, page: number) => (
    useQuery<PaginatedResponse<Book>, Error>({
        queryKey: getSectionQueryKey(token, section, page),
        queryFn: async () => {
            if (!token) {
                return EMPTY_PAGE;
            }

            return (await booksApi.getSection(section, page, SECTION_PAGE_SIZE)) || EMPTY_PAGE;
        },
        enabled: !!token,
    })
);

export const useLibraryPageData = (sectionPages: SectionPages) => {
    const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const currentQuery = useSectionQuery(token, 'current', sectionPages.current);
    const nextQuery = useSectionQuery(token, 'next', sectionPages.next);
    const finishedQuery = useSectionQuery(token, 'finished', sectionPages.finished);

    const invalidateLibraryViews = () => {
        queryClient.invalidateQueries({ queryKey: ['myBooksSection'] });
        queryClient.invalidateQueries({ queryKey: ['myBooks'] });
        queryClient.invalidateQueries({ queryKey: ['home'] });
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        queryClient.invalidateQueries({ queryKey: ['stats'] });
        queryClient.invalidateQueries({ queryKey: ['ownedIsbns'] });
    };

    const deleteBookMutation = useMutation<unknown, ApiError, number>({
        mutationFn: (id) => booksApi.delete(id),
        onSuccess: (_, id) => {
            setSelectedBooks((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            invalidateLibraryViews();
        },
    });

    const deleteSelectedMutation = useMutation<unknown, ApiError, number[]>({
        mutationFn: async (ids) => {
            const results = await Promise.allSettled(ids.map((id) => booksApi.delete(id)));
            if (results.some((result) => result.status === 'rejected')) {
                throw new Error('Some deletions failed');
            }
        },
        onSuccess: () => {
            setSelectedBooks(new Set());
            invalidateLibraryViews();
        },
    });

    const deleteAllMutation = useMutation<unknown, ApiError>({
        mutationFn: () => booksApi.deleteAll(),
        onSuccess: () => {
            setSelectedBooks(new Set());
            invalidateLibraryViews();
        },
    });

    const sections = useMemo(() => ({
        current: currentQuery.data || EMPTY_PAGE,
        next: nextQuery.data || EMPTY_PAGE,
        finished: finishedQuery.data || EMPTY_PAGE,
    }), [currentQuery.data, finishedQuery.data, nextQuery.data]);

    return {
        sections,
        loading: currentQuery.isLoading || nextQuery.isLoading || finishedQuery.isLoading,
        error: currentQuery.error?.message || nextQuery.error?.message || finishedQuery.error?.message || null,
        selectedBooks,
        toggleSelection: (id: number) => {
            setSelectedBooks((prev) => {
                const next = new Set(prev);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.add(id);
                }
                return next;
            });
        },
        deleteBook: (id: number) => deleteBookMutation.mutate(id),
        deleteSelected: () => deleteSelectedMutation.mutate(Array.from(selectedBooks)),
        deleteAll: () => deleteAllMutation.mutate(),
        deleteError: deleteBookMutation.error ?? deleteSelectedMutation.error ?? deleteAllMutation.error,
    };
};
