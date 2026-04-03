import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReadingSessionContext } from '../../reading-session';
import { useLibraryPageData } from './useLibraryPageData';
import type { Book, LibrarySectionKey, PaginatedResponse } from '../../../shared/types/books';

export type LibrarySection = {
    key: LibrarySectionKey;
    title: string;
    hint: string;
    books: Book[];
    totalBooks: number;
    page: number;
    totalPages: number;
};

const toLibrarySection = (
    key: LibrarySectionKey,
    title: string,
    hint: string,
    data: PaginatedResponse<Book>,
): LibrarySection => ({
    key,
    title,
    hint,
    books: data.content || [],
    totalBooks: data.totalElements || 0,
    page: data.number || 0,
    totalPages: Math.max(data.totalPages || 0, 1),
});

export const useLibrarySections = () => {
    const { t } = useTranslation();
    const { activeSession } = useReadingSessionContext();
    const [sectionPages, setSectionPages] = useState<Record<LibrarySectionKey, number>>({
        current: 0,
        next: 0,
        finished: 0,
    });

    const {
        loading,
        error,
        sections: sectionPagesData,
        selectedBooks,
        toggleSelection,
        deleteSelected,
        deleteAll,
        deleteError,
        clearDeleteError,
    } = useLibraryPageData(sectionPages);

    const currentSection = toLibrarySection(
        'current',
        t('myBooks.sections.current'),
        activeSession ? t('myBooks.sections.currentHintActive') : t('myBooks.sections.currentHint'),
        sectionPagesData.current,
    );
    const nextSection = toLibrarySection('next', t('myBooks.sections.next'), t('myBooks.sections.nextHint'), sectionPagesData.next);
    const finishedSection = toLibrarySection('finished', t('myBooks.sections.finished'), t('myBooks.sections.finishedHint'), sectionPagesData.finished);

    const sections: LibrarySection[] = [currentSection, nextSection, finishedSection];
    const totalBooks = sections.reduce((sum, s) => sum + s.totalBooks, 0);

    useEffect(() => {
        setSectionPages((prev) => {
            const next = { ...prev };
            let changed = false;
            for (const [key, totalPages] of [
                ['current', currentSection.totalPages],
                ['next', nextSection.totalPages],
                ['finished', finishedSection.totalPages],
            ] as const) {
                const clamped = Math.min(prev[key] ?? 0, totalPages - 1);
                if (next[key] !== clamped) {
                    next[key] = clamped;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [currentSection.totalPages, nextSection.totalPages, finishedSection.totalPages]);

    const goToPreviousPage = (key: LibrarySectionKey) => {
        setSectionPages((prev) => ({
            ...prev,
            [key]: Math.max(0, (prev[key] ?? 0) - 1),
        }));
    };

    const goToNextPage = (key: LibrarySectionKey, maxPages: number) => {
        setSectionPages((prev) => ({
            ...prev,
            [key]: Math.min(maxPages - 1, (prev[key] ?? 0) + 1),
        }));
    };

    return {
        loading,
        error,
        sections,
        totalBooks,
        selectedBooks,
        toggleSelection,
        deleteSelected,
        deleteAll,
        deleteError,
        clearDeleteError,
        goToPreviousPage,
        goToNextPage,
    };
};
