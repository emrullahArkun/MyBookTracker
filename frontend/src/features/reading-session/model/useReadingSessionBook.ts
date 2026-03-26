import { useEffect, useState } from 'react';
import type { UseToastOptions } from '@chakra-ui/react';
import { readingSessionBooksApi } from '../api';
import type { Book } from '../../../shared/types/books';

type ToastFn = (options?: UseToastOptions) => void;

type UseReadingSessionBookParams = {
    bookId: number | null;
    token: string | null;
    toast: ToastFn;
    t: (key: string) => string;
};

export const useReadingSessionBook = ({ bookId, token, toast, t }: UseReadingSessionBookParams) => {
    const [book, setBook] = useState<Book | null>(null);
    const [fetchingBook, setFetchingBook] = useState(true);

    useEffect(() => {
        if (!token || bookId === null) {
            setBook(null);
            setFetchingBook(false);
            return;
        }

        const fetchBook = async () => {
            try {
                const data = await readingSessionBooksApi.getById(bookId);
                setBook(data ?? null);
            } catch {
                toast({
                    title: t('readingSession.alerts.fetchError'),
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setFetchingBook(false);
            }
        };

        void fetchBook();
    }, [bookId, token, t, toast]);

    return { book, fetchingBook };
};
