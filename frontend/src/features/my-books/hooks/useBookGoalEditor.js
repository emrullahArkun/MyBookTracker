import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { booksApi } from '../../books/api';

export const useBookGoalEditor = ({ book, bookId, refetch, onClose }) => {
    const { t } = useTranslation();
    const toast = useToast();
    const [goalType, setGoalType] = useState('WEEKLY');
    const [goalPages, setGoalPages] = useState('');
    const [isSavingGoal, setIsSavingGoal] = useState(false);

    useEffect(() => {
        if (book?.readingGoalType) {
            setGoalType(book.readingGoalType);
        }
        if (book?.readingGoalPages) {
            setGoalPages(book.readingGoalPages);
        }
    }, [book]);

    const handleSaveGoal = async () => {
        setIsSavingGoal(true);
        try {
            await booksApi.updateGoal(bookId, goalType, parseInt(goalPages, 10));
            toast({ title: t('bookStats.goal.modal.success'), status: 'success', duration: 3000 });
            refetch();
            onClose();
        } catch {
            toast({ title: t('bookStats.goal.modal.error'), status: 'error', duration: 3000 });
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
