import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth';
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

const getSectionQueryKey = (section: LibrarySectionKey, page: number) => (
    ['myBooksSection', section, page] as const
);

const useSectionQuery = (email: string | null, section: LibrarySectionKey, page: number) => (
    useQuery<PaginatedResponse<Book>, Error>({
        queryKey: getSectionQueryKey(section, page),
        queryFn: async () => {
            if (!email) {
                return EMPTY_PAGE;
            }

            return (await booksApi.getSection(section, page, SECTION_PAGE_SIZE)) || EMPTY_PAGE;
        },
        enabled: !!email,
        placeholderData: (previousData) => previousData ?? EMPTY_PAGE,
    })
);

export const useLibraryPageData = (sectionPages: SectionPages) => {
    const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
    const [deleteError, setDeleteError] = useState<ApiError | null>(null);
    const { email } = useAuth();
    const queryClient = useQueryClient();
    const clearDeleteError = useCallback(() => {
        setDeleteError(null);
    }, []);

    const currentQuery = useSectionQuery(email, 'current', sectionPages.current);
    const nextQuery = useSectionQuery(email, 'next', sectionPages.next);
    const finishedQuery = useSectionQuery(email, 'finished', sectionPages.finished);
    const sectionQueries = [currentQuery, nextQuery, finishedQuery];

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
        onMutate: () => {
            clearDeleteError();
        },
        onSuccess: (_, id) => {
            setSelectedBooks((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            invalidateLibraryViews();
        },
        onError: (error) => {
            setDeleteError(error);
        },
    });

    const deleteSelectedMutation = useMutation<unknown, ApiError, number[]>({
        mutationFn: async (ids) => {
            const results = await Promise.allSettled(ids.map((id) => booksApi.delete(id)));
            const fulfilled = ids.filter((_, i) => results[i].status === 'fulfilled');
            const rejected = ids.filter((_, i) => results[i].status === 'rejected');

            if (rejected.length > 0) {
                setSelectedBooks((prev) => {
                    const next = new Set(prev);
                    fulfilled.forEach((id) => next.delete(id));
                    return next;
                });
                throw new Error('Some deletions failed');
            }
        },
        onMutate: () => {
            clearDeleteError();
        },
        onSuccess: () => {
            setSelectedBooks(new Set());
        },
        onError: (error) => {
            setDeleteError(error);
        },
        onSettled: () => {
            invalidateLibraryViews();
        },
    });

    const deleteAllMutation = useMutation<unknown, ApiError>({
        mutationFn: () => booksApi.deleteAll(),
        onMutate: () => {
            clearDeleteError();
        },
        onSuccess: () => {
            setSelectedBooks(new Set());
            invalidateLibraryViews();
        },
        onError: (error) => {
            setDeleteError(error);
        },
    });

    const sections = useMemo(() => ({
        current: currentQuery.data || EMPTY_PAGE,
        next: nextQuery.data || EMPTY_PAGE,
        finished: finishedQuery.data || EMPTY_PAGE,
    }), [currentQuery.data, finishedQuery.data, nextQuery.data]);

    const loading = sectionQueries.some((query) => (
        query.isLoading || (query.isFetching && query.dataUpdatedAt === 0)
    ));

    return {
        sections,
        loading,
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
        deleteError,
        clearDeleteError,
    };
};
