import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { booksApi } from '../api';
import { createAppToast } from '../../../shared/ui/AppToast';

import type { Book, ReadingGoalType } from '../../../shared/types/books';

type UseBookGoalEditorParams = {
    book: Book | null;
    bookId: string | undefined;
    refetch: () => void;
    onClose: () => void;
};

export const useBookGoalEditor = ({ book, bookId, refetch, onClose }: UseBookGoalEditorParams) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [goalType, setGoalType] = useState<NonNullable<ReadingGoalType>>('WEEKLY');
    const [goalPages, setGoalPages] = useState('');
    const [isSavingGoal, setIsSavingGoal] = useState(false);

    useEffect(() => {
        if (book?.readingGoalType === 'WEEKLY' || book?.readingGoalType === 'MONTHLY') {
            setGoalType(book.readingGoalType);
        }
        if (book?.readingGoalPages) {
            setGoalPages(String(book.readingGoalPages));
        }
    }, [book]);

    const handleSaveGoal = async () => {
        setIsSavingGoal(true);
        try {
            await booksApi.updateGoal(Number(bookId), goalType, parseInt(goalPages, 10));
            toast(createAppToast({
                title: t('bookStats.goal.modal.success'),
                status: 'success',
                duration: 3000,
            }));
            refetch();
            onClose();
        } catch {
            toast(createAppToast({
                title: t('bookStats.goal.modal.error'),
                status: 'error',
                duration: 3000,
            }));
        } finally {
            setIsSavingGoal(false);
        }
    };

    return {
        goalType,
        setGoalType,
        goalPages,
        setGoalPages,
        isSavingGoal,
        handleSaveGoal,
    };
};
