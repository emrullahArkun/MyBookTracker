import { useEffect, useState } from 'react';
import { booksApi } from '../../books/api';

export const useReadingSessionBook = ({ bookId, token, toast, t }) => {
    const [book, setBook] = useState(null);
    const [fetchingBook, setFetchingBook] = useState(true);

    useEffect(() => {
        if (!token) {
            setBook(null);
            setFetchingBook(false);
            return;
        }

        const fetchBook = async () => {
            try {
                const data = await booksApi.getById(bookId);
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

        fetchBook();
    }, [bookId, token, t, toast]);

    return { book, fetchingBook };
};
