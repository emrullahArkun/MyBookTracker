import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData, type QueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/model';
import { booksApi } from '../api';
import type { Book, PaginatedResponse } from '../../../shared/types/books';

const PAGE_SIZE = 12;

type BooksPage = PaginatedResponse<Book>;
type BooksQueryKey = readonly ['myBooks', string | null, number, number];
type MutationContext = {
    previousData?: BooksPage | undefined;
};

type BookId = number;
type UpdateProgressVars = {
    id: number;
    currentPage: number;
};
type UpdateStatusVars = {
    id: number;
    completed: boolean;
};

const createEmptyBooksPage = (page = 0, size = PAGE_SIZE): BooksPage => ({
    content: [],
    totalPages: 0,
    totalElements: 0,
    size,
    number: page,
});

const createOptimisticMutation = <TVars,>(
    queryClient: QueryClient,
    queryKey: BooksQueryKey,
    mutationFn: (vars: TVars) => Promise<unknown>,
    updater: (prev: BooksPage, vars: TVars) => BooksPage
) => ({
    mutationFn,
    onMutate: async (vars: TVars): Promise<MutationContext> => {
        await queryClient.cancelQueries({ queryKey: ['myBooks'] });
        const previousData = queryClient.getQueryData<BooksPage>(queryKey);
        if (previousData) {
            queryClient.setQueryData<BooksPage>(queryKey, updater(previousData, vars));
        }
        return { previousData };
    },
    onError: (_err: Error, _vars: TVars, context: MutationContext | undefined) => {
        if (context?.previousData) {
            queryClient.setQueryData<BooksPage>(queryKey, context.previousData);
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['myBooks'] });
    },
});

export const useMyBooks = () => {
    const pageSize = PAGE_SIZE;
    const [page, setPage] = useState(0);
    const [selectedBooks, setSelectedBooks] = useState<Set<number>>(new Set());
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const queryKey: BooksQueryKey = ['myBooks', token, page, pageSize];

    const { data, isLoading: loading, error } = useQuery<BooksPage, Error>({
        queryKey,
        queryFn: async () => {
            if (!token) return createEmptyBooksPage(page, pageSize);
            return (await booksApi.getAll(page, pageSize)) || createEmptyBooksPage(page, pageSize);
        },
        placeholderData: keepPreviousData,
        enabled: !!token,
    });

    const books = data?.content || [];
    const totalPages = data?.totalPages || 0;
    const maxPage = Math.max(totalPages - 1, 0);

    useEffect(() => {
        const clampedPage = Math.min(page, maxPage);

        if (page !== clampedPage) {
            setPage(clampedPage);
        }
    }, [page, maxPage]);

    const deleteMutation = useMutation<unknown, Error, BookId, MutationContext>(
        createOptimisticMutation(
            queryClient,
            queryKey,
            async (id) => booksApi.delete(id),
            (prev, id) => ({ ...prev, content: prev.content.filter((book) => book.id !== id) })
        )
    );

    const deleteAllMutation = useMutation<unknown, Error, void, MutationContext>({
        ...createOptimisticMutation(
            queryClient,
            queryKey,
            async () => booksApi.deleteAll(),
            () => createEmptyBooksPage(page, pageSize)
        ),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            setSelectedBooks(new Set());
        },
    });

    const updateProgressMutation = useMutation<unknown, Error, UpdateProgressVars, MutationContext>(
        createOptimisticMutation(
            queryClient,
            queryKey,
            async ({ id, currentPage }) => booksApi.updateProgress(id, currentPage),
            (prev, { id, currentPage }) => ({
                ...prev,
                content: prev.content.map((book) => book.id === id ? { ...book, currentPage } : book),
            })
        )
    );

    const updateStatusMutation = useMutation<unknown, Error, UpdateStatusVars, MutationContext>(
        createOptimisticMutation(
            queryClient,
            queryKey,
            async ({ id, completed }) => booksApi.updateStatus(id, completed),
            (prev, { id, completed }) => ({
                ...prev,
                content: prev.content.map((book) => book.id === id ? { ...book, completed } : book),
            })
        )
    );

    const toggleSelection = (id: number) => {
        setSelectedBooks((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const deleteBook = (id: number) => {
        deleteMutation.mutate(id);
        setSelectedBooks((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const deleteSelectedMutation = useMutation<unknown, Error, number[], MutationContext>({
        ...createOptimisticMutation(
            queryClient,
            queryKey,
            async (ids) => {
                const results = await Promise.allSettled(ids.map((id) => booksApi.delete(id)));
                if (results.some((result) => result.status === 'rejected')) {
                    throw new Error('Some deletions failed');
                }
            },
            (prev, ids) => ({
                ...prev,
                content: prev.content.filter((book) => !ids.includes(book.id)),
            })
        ),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            setSelectedBooks(new Set());
        },
    });

    const deleteSelected = () => {
        deleteSelectedMutation.mutate(Array.from(selectedBooks));
    };

    const deleteAll = () => {
        deleteAllMutation.mutate();
    };

    const updateBookProgress = (id: number, currentPage: number) => {
        updateProgressMutation.mutate({ id, currentPage });
    };

    const updateBookStatus = (id: number, completed: boolean) => {
        updateStatusMutation.mutate({ id, completed });
    };

    const deleteError = deleteSelectedMutation.error ?? deleteAllMutation.error ?? deleteMutation.error;

    return {
        books,
        loading,
        error: error ? error.message : null,
        selectedBooks,
        toggleSelection,
        deleteBook,
        deleteSelected,
        deleteAll,
        updateBookProgress,
        updateBookStatus,
        page,
        setPage,
        totalPages,
        deleteError,
        updateProgressError: updateProgressMutation.error,
    };
};
