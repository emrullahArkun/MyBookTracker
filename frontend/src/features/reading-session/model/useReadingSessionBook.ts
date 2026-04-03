import { useQuery } from '@tanstack/react-query';
import { readingSessionBooksApi } from '../api';
import type { Book } from '../../../shared/types/books';

type UseReadingSessionBookParams = {
    bookId: number | null;
    email: string | null;
};

export const useReadingSessionBook = ({ bookId, email }: UseReadingSessionBookParams) => {
    const { data: book = null, isLoading: fetchingBook } = useQuery<Book | null>({
        queryKey: ['reading-session-book', bookId],
        queryFn: () => readingSessionBooksApi.getById(bookId!),
        enabled: !!email && bookId !== null,
    });

    return { book, fetchingBook };
};
