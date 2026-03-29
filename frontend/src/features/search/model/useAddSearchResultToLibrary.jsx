import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../auth/model';
import { booksApi, buildLibraryBookPayload } from '../../library/api';
import { createAppToast } from '../../../shared/ui/AppToast';

export const useAddSearchResultToLibrary = () => {
    const { token, user } = useAuth();
    const toast = useToast();
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (book) => {
            if (!token) {
                throw new Error(t('search.toast.loginRequired'));
            }

            return booksApi.create(buildLibraryBookPayload(book));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            queryClient.invalidateQueries({ queryKey: ['ownedIsbns', user?.email] });
            queryClient.invalidateQueries({ queryKey: ['discovery'] });
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
        }
    });
};
