import { useQuery } from '@tanstack/react-query';
import { booksApi } from '../api';
import { sessionsApi } from '../../reading-session';
import { useAuth } from '../../auth';

/**
 * Hook to fetch book details and reading sessions for a specific book.
 * Uses React Query for caching, automatic re-fetching, and consistent data fetching patterns.
 */
import type { Book } from '../../../shared/types/books';
import type { ReadingSession } from '../../../shared/types/sessions';

export const useBookStats = (bookId: string | undefined) => {
    const { email } = useAuth();

    // Query for book details
    const {
        data: book = null,
        isLoading: bookLoading,
        error: bookError,
        refetch: refetchBook
    } = useQuery<Book | null>({
        queryKey: ['book', email, bookId],
        queryFn: () => booksApi.getById(Number(bookId)),
        enabled: !!email && !!bookId
    });

    // Query for sessions
    const {
        data: sessions = [],
        isLoading: sessionsLoading,
        error: sessionsError,
        refetch: refetchSessions
    } = useQuery<ReadingSession[]>({
        queryKey: ['bookSessions', email, bookId],
        queryFn: async () => (await sessionsApi.getByBookId(Number(bookId))) ?? [],
        enabled: !!email && !!bookId
    });

    // Combined loading/error states for backward compatibility
    const loading = bookLoading || sessionsLoading;
    const error = bookError || sessionsError;

    const refetch = async () => {
        await Promise.all([refetchBook(), refetchSessions()]);
    };

    return { book, sessions, loading, error, refetch };
};
