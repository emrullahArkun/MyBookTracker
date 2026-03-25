import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { booksApi } from '../../books/api';
import apiClient from '../../../api/apiClient';

const EMPTY_STREAK = { currentStreak: 0, longestStreak: 0 };

const getProgressRatio = (book) => {
    if (!book.readingGoalPages) {
        return 0;
    }
    return (book.readingGoalProgress || 0) / book.readingGoalPages;
};

const sortBooks = (books) => [...books].sort((a, b) => {
    if (a.readingGoalType !== b.readingGoalType) {
        return a.readingGoalType === 'WEEKLY' ? -1 : 1;
    }
    return getProgressRatio(b) - getProgressRatio(a);
});

export const useGoalsData = () => {
    const { token, user } = useAuth();

    const booksQuery = useQuery({
        queryKey: ['goals', user?.email, 'books'],
        queryFn: () => booksApi.getWithGoals(),
        enabled: !!token,
    });

    const streakQuery = useQuery({
        queryKey: ['goals', user?.email, 'streak'],
        queryFn: () => apiClient.get('/api/stats/streak'),
        enabled: !!token,
    });

    const { activeBooks, completedBooks } = useMemo(() => {
        const sortedBooks = sortBooks(booksQuery.data || []);

        return {
            activeBooks: sortedBooks.filter(book => (book.readingGoalProgress || 0) < (book.readingGoalPages || 0)),
            completedBooks: sortedBooks.filter(book => (book.readingGoalProgress || 0) >= (book.readingGoalPages || 0)),
        };
    }, [booksQuery.data]);

    return {
        activeBooks,
        completedBooks,
        streak: streakQuery.data || EMPTY_STREAK,
        loading: booksQuery.isLoading || streakQuery.isLoading,
        error: booksQuery.error?.message || streakQuery.error?.message || null,
        isError: booksQuery.isError || streakQuery.isError,
        refresh: async () => {
            await Promise.all([booksQuery.refetch(), streakQuery.refetch()]);
        },
    };
};
