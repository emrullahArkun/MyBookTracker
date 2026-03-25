import { useQuery } from '@tanstack/react-query';
import { booksApi } from '../../books/api';
import { sessionsApi } from '../../reading-sessions/api/sessionsApi';
import { useAuth } from '../../../context/AuthContext';

/**
 * Hook to fetch book details and reading sessions for a specific book.
 * Uses React Query for caching, automatic re-fetching, and consistent data fetching patterns.
 */
export const useBookStats = (bookId) => {
    const { token } = useAuth();

    // Query for book details
    const {
        data: book,
        isLoading: bookLoading,
        error: bookError,
        refetch: refetchBook
    } = useQuery({
        queryKey: ['book', token, bookId],
        queryFn: () => booksApi.getById(bookId),
        enabled: !!token && !!bookId
    });

    // Query for sessions
    const {
        data: sessions = [],
        isLoading: sessionsLoading,
        error: sessionsError,
        refetch: refetchSessions
    } = useQuery({
        queryKey: ['bookSessions', token, bookId],
        queryFn: () => sessionsApi.getByBookId(bookId),
        enabled: !!token && !!bookId
    });

    // Combined loading/error states for backward compatibility
    const loading = bookLoading || sessionsLoading;
    const error = bookError || sessionsError;

    const refetch = async () => {
        await Promise.all([refetchBook(), refetchSessions()]);
    };

    return { book, sessions, loading, error, refetch };
};
