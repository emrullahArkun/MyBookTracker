import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { goalsApi } from '../api/goalsApi';
import type { Book } from '../../../shared/types/books';
import type { Streak } from '../../../shared/types/stats';

const EMPTY_STREAK: Streak = { currentStreak: 0, longestStreak: 0 };

const getProgressRatio = (book: Book): number => {
    if (!book.readingGoalPages) {
        return 0;
    }

    return (book.readingGoalProgress || 0) / book.readingGoalPages;
};

const sortBooks = (books: Book[]): Book[] => [...books].sort((a, b) => {
    if (a.readingGoalType !== b.readingGoalType) {
        return a.readingGoalType === 'WEEKLY' ? -1 : 1;
    }

    return getProgressRatio(b) - getProgressRatio(a);
});

export const useGoalsData = () => {
    const { email, user } = useAuth();

    const booksQuery = useQuery<Book[], Error>({
        queryKey: ['goals', user?.email, 'books'],
        queryFn: async () => (await goalsApi.getBooks()) || [],
        enabled: !!email,
    });

    const streakQuery = useQuery<Streak, Error>({
        queryKey: ['goals', user?.email, 'streak'],
        queryFn: async () => (await goalsApi.getStreak()) || EMPTY_STREAK,
        enabled: !!email,
    });

    const { activeBooks, completedBooks } = useMemo(() => {
        const sortedBooks = sortBooks(booksQuery.data || []);

        return {
            activeBooks: sortedBooks.filter((book) => (book.readingGoalProgress || 0) < (book.readingGoalPages || 0)),
            completedBooks: sortedBooks.filter((book) => (book.readingGoalProgress || 0) >= (book.readingGoalPages || 0)),
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
