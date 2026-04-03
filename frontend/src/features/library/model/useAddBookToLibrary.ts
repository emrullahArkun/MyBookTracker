import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth';
import { booksApi } from '../api';
import { buildLibraryBookPayload } from '../api';
import type { ApiError } from '../../../shared/types/http';
import type { Book, LibraryBookSource } from '../../../shared/types/books';
import { createAppToast } from '../../../shared/ui/AppToast';

type UseAddBookToLibraryOptions = {
    onSuccess?: (data: Book | null, book: LibraryBookSource) => void;
};

export const useAddBookToLibrary = (
    options?: UseAddBookToLibraryOptions,
) => {
    const { email, user } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation<Book | null, ApiError, LibraryBookSource>({
        mutationFn: async (book) => {
            if (!email) {
                throw new Error(t('search.toast.loginRequired'));
            }

            return booksApi.create(buildLibraryBookPayload(book));
        },
        onSuccess: (data, addedBook) => {
            options?.onSuccess?.(data, addedBook);

            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            queryClient.invalidateQueries({ queryKey: ['home'] });
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
