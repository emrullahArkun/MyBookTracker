import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { booksApi } from '../../books/api';
import { mapGoogleBookToNewBook } from '../../../utils/googleBooks';

const TOAST_STYLE = {
    containerStyle: { marginTop: '80px' },
    position: 'top',
    duration: 3000,
};

const ToastMessage = ({ bgColor, children }) => (
    <div style={{
        backgroundColor: bgColor,
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        fontWeight: '600',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
    }}>
        {children}
    </div>
);

export const useAddBookToLibrary = () => {
    const { token, user } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (book) => {
            if (!token) throw new Error(t('search.toast.loginRequired'));

            const volumeInfo = book.volumeInfo;
            const isbnInfo = volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')
                || volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10');

            if (!isbnInfo && !book.id) throw new Error(t('search.toast.noIsbn'));

            const newBook = mapGoogleBookToNewBook(volumeInfo, isbnInfo, book.id);

            // Fallback: If pageCount is 0 or missing, try OpenLibrary
            if ((!newBook.pageCount || newBook.pageCount === 0) && isbnInfo) {
                try {
                    const cleanIsbn = isbnInfo.identifier;
                    const olUrl = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
                    const response = await fetch(olUrl);
                    if (response.ok) {
                        const data = await response.json();
                        const bookKey = `ISBN:${cleanIsbn}`;
                        if (data[bookKey]?.number_of_pages) {
                            newBook.pageCount = data[bookKey].number_of_pages;
                        }
                    }
                } catch {
                    // Silently fail fallback and proceed with 0 pages
                }
            }

            return { result: await booksApi.create(newBook), isbnInfo };
        },
        onSuccess: ({ isbnInfo }) => {
            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            queryClient.invalidateQueries({ queryKey: ['ownedIsbns', user?.email] });

            // Optimistically remove the added book from discovery cache
            const addedIsbn = isbnInfo?.identifier?.replace(/-/g, '');
            if (addedIsbn) {
                queryClient.setQueryData(['discovery', user?.email], (old) => {
                    if (!old) return old;
                    const filterBooks = (books) =>
                        (books || []).filter(b => b.isbn?.replace(/-/g, '') !== addedIsbn);
                    return {
                        byAuthor: { ...old.byAuthor, books: filterBooks(old.byAuthor?.books) },
                        byCategory: { ...old.byCategory, books: filterBooks(old.byCategory?.books) },
                        bySearch: { ...old.bySearch, books: filterBooks(old.bySearch?.books) },
                    };
                });
            }
            toast.close('add-book-toast');
            toast({
                id: 'add-book-toast',
                ...TOAST_STYLE,
                render: () => (
                    <ToastMessage bgColor="#38A169">
                        {t('search.toast.successTitle')}
                    </ToastMessage>
                )
            });
        },
        onError: (err) => {
            const isDuplicate = err.status === 409;
            const message = isDuplicate ? t('search.toast.duplicate') : (err.message || t('search.toast.addFailed'));
            const bgColor = isDuplicate ? '#DD6B20' : '#E53E3E';

            toast.close('add-book-toast');
            toast({
                id: 'add-book-toast',
                ...TOAST_STYLE,
                render: () => (
                    <ToastMessage bgColor={bgColor}>
                        {message}
                    </ToastMessage>
                )
            });
        }
    });
};
