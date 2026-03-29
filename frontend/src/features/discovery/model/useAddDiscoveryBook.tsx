import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/model';
import { booksApi, buildLibraryBookPayload } from '../../library/api';
import type { ApiError } from '../../../shared/types/http';
import type { Book } from '../../../shared/types/books';
import type { DiscoveryResponse, RecommendedBook } from '../../../shared/types/discovery';
import { createAppToast } from '../../../shared/ui/AppToast';

const removeBookFromDiscoverySection = <
    TSection extends { books?: RecommendedBook[] } | undefined
>(section: TSection, isbn: string | null) => ({
    ...section,
    books: (section?.books || []).filter((book) => book.isbn !== isbn),
});

export const useAddDiscoveryBook = () => {
    const { token, user } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation<Book | null, ApiError, RecommendedBook>({
        mutationFn: async (book) => {
            if (!token) {
                throw new Error(t('search.toast.loginRequired'));
            }

            return booksApi.create(buildLibraryBookPayload(book));
        },
        onSuccess: (_, addedBook) => {
            queryClient.setQueryData<DiscoveryResponse | undefined>(['discovery', user?.email], (currentDiscovery) => {
                if (!currentDiscovery) {
                    return currentDiscovery;
                }

                return {
                    byAuthor: removeBookFromDiscoverySection(currentDiscovery.byAuthor, addedBook.isbn),
                    byCategory: removeBookFromDiscoverySection(currentDiscovery.byCategory, addedBook.isbn),
                    bySearch: removeBookFromDiscoverySection(currentDiscovery.bySearch, addedBook.isbn),
                };
            });
            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            queryClient.invalidateQueries({ queryKey: ['ownedIsbns', user?.email] });
            const toastOptions = createAppToast({
                id: 'add-book-toast',
                title: t('search.toast.successTitle'),
                status: 'success',
                duration: 3000,
            });
            if (toast.isActive('add-book-toast')) {
                toast.update('add-book-toast', toastOptions);
            } else {
                toast(toastOptions);
            }
        },
        onError: (err) => {
            const isDuplicate = err.status === 409;
            const message = isDuplicate ? t('search.toast.duplicate') : (err.message || t('search.toast.addFailed'));

            const toastOptions = createAppToast({
                id: 'add-book-toast',
                title: message,
                status: isDuplicate ? 'warning' : 'error',
                duration: 3000,
            });
            if (toast.isActive('add-book-toast')) {
                toast.update('add-book-toast', toastOptions);
            } else {
                toast(toastOptions);
            }
        },
    });
};
