import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { booksApi } from '../../books/api';
import { getOpenLibraryCoverUrl } from '../../../utils/coverUtils';

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

            const isbn = book.isbn || null;
            const coverUrl = book.coverUrl || (isbn ? getOpenLibraryCoverUrl(isbn) : '');

            const categories = Array.isArray(book.categories)
                ? book.categories
                : (book.categories ? [book.categories] : []);

            const newBook = {
                title: book.title,
                isbn: isbn,
                authorName: Array.isArray(book.authors) ? book.authors[0] : (book.authors || 'Unknown Author'),
                publishYear: book.publishYear || null,
                coverUrl: coverUrl,
                pageCount: book.pageCount || 0,
                categories: categories,
            };

            return { result: await booksApi.create(newBook), isbn };
        },
        onSuccess: ({ isbn }) => {
            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            queryClient.invalidateQueries({ queryKey: ['ownedIsbns', user?.email] });
            queryClient.invalidateQueries({ queryKey: ['discovery'] });
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
