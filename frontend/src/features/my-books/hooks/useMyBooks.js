import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { booksApi } from '../../books/api';

/**
 * Creates a mutation with optimistic update boilerplate.
 */
const createOptimisticMutation = (queryClient, queryKey, mutationFn, updater) => ({
    mutationFn,
    onMutate: async (vars) => {
        await queryClient.cancelQueries({ queryKey: ['myBooks'] });
        const previousData = queryClient.getQueryData(queryKey);
        if (previousData) {
            queryClient.setQueryData(queryKey, updater(previousData, vars));
        }
        return { previousData };
    },
    onError: (_err, _vars, context) => {
        if (context?.previousData) {
            queryClient.setQueryData(queryKey, context.previousData);
        }
    },
    onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['myBooks'] });
    }
});

export const useMyBooks = (pageSize = 12) => {
    const [page, setPage] = useState(0);
    const [selectedBooks, setSelectedBooks] = useState(new Set());
    const { token } = useAuth();
    const queryClient = useQueryClient();

    const queryKey = ['myBooks', token, page, pageSize];

    const { data, isLoading: loading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!token) return { content: [], totalPages: 0 };
            return await booksApi.getAll(page, pageSize);
        },
        placeholderData: keepPreviousData,
        enabled: !!token
    });

    const books = data?.content || [];
    const totalPages = data?.totalPages || 0;

    const deleteMutation = useMutation(
        createOptimisticMutation(queryClient, queryKey,
            async (id) => booksApi.delete(id),
            (prev, id) => ({ ...prev, content: prev.content.filter(book => book.id !== id) })
        )
    );

    const deleteAllMutation = useMutation({
        ...createOptimisticMutation(queryClient, queryKey,
            async () => booksApi.deleteAll(),
            () => ({ content: [], totalPages: 0 })
        ),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            setSelectedBooks(new Set());
        }
    });

    const updateProgressMutation = useMutation(
        createOptimisticMutation(queryClient, queryKey,
            async ({ id, currentPage }) => booksApi.updateProgress(id, currentPage),
            (prev, { id, currentPage }) => ({
                ...prev,
                content: prev.content.map(book => book.id === id ? { ...book, currentPage } : book)
            })
        )
    );

    const updateStatusMutation = useMutation(
        createOptimisticMutation(queryClient, queryKey,
            async ({ id, completed }) => booksApi.updateStatus(id, completed),
            (prev, { id, completed }) => ({
                ...prev,
                content: prev.content.map(book => book.id === id ? { ...book, completed } : book)
            })
        )
    );

    const toggleSelection = (id) => {
        setSelectedBooks(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const deleteBook = (id) => {
        deleteMutation.mutate(id);
        setSelectedBooks(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    };

    const deleteSelected = async () => {
        const ids = Array.from(selectedBooks);

        await queryClient.cancelQueries({ queryKey: ['myBooks'] });
        const previousData = queryClient.getQueryData(queryKey);

        if (previousData) {
            queryClient.setQueryData(queryKey, {
                ...previousData,
                content: previousData.content.filter(book => !selectedBooks.has(book.id))
            });
        }

        setSelectedBooks(new Set());

        const results = await Promise.allSettled(
            ids.map(id => booksApi.delete(id))
        );

        const failed = results.some(r => r.status === 'rejected');

        if (failed) {
            // Some deletions failed — rollback optimistic update
            if (previousData) {
                queryClient.setQueryData(queryKey, previousData);
            }
        }

        queryClient.invalidateQueries({ queryKey: ['myBooks'] });
    };

    const deleteAll = () => {
        deleteAllMutation.mutate();
    };

    const updateBookProgress = (id, currentPage) => {
        updateProgressMutation.mutate({ id, currentPage });
    };

    const updateBookStatus = (id, completed) => {
        updateStatusMutation.mutate({ id, completed });
    };

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
        deleteError: deleteMutation.error,
        updateProgressError: updateProgressMutation.error
    };
};
