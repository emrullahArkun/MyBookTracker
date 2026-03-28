import { useEffect, useReducer, type Dispatch, type SetStateAction } from 'react';
import type { UseToastOptions } from '@chakra-ui/react';
import {
    createInitialStopFlowState,
    READING_SESSION_STOP_EVENTS,
    readingSessionStopReducer,
} from './readingSessionStopMachine';
import type { Book } from '../../../shared/types/books';
import { createAppToast } from '../../../shared/ui/AppToast';

type TranslationValues = Record<string, string | number>;

type TranslationFn = (key: string, values?: TranslationValues) => string;

type ToastFn = (options?: UseToastOptions) => void;

type StopFlowBook = Pick<Book, 'currentPage' | 'pageCount'>;

export type SessionCompletionSummary = {
    startPage: number;
    endPage: number;
    pagesRead: number;
};

type UseReadingSessionStopFlowParams = {
    book: StopFlowBook | null;
    isPaused: boolean;
    isBusy: boolean;
    pauseSession: () => Promise<void>;
    resumeSession: () => Promise<void>;
    stopSession: (endTime: Date, endPage?: number) => Promise<boolean>;
    toast: ToastFn;
    t: TranslationFn;
    setHasStopped: Dispatch<SetStateAction<boolean>>;
    onStopSuccess: (summary: SessionCompletionSummary) => void;
};

export const useReadingSessionStopFlow = ({
    book,
    isPaused,
    isBusy,
    pauseSession,
    resumeSession,
    stopSession,
    toast,
    t,
    setHasStopped,
    onStopSuccess,
}: UseReadingSessionStopFlowParams) => {
    const [state, dispatch] = useReducer(readingSessionStopReducer, undefined, createInitialStopFlowState);
    const { isOpen: showStopConfirm, endPage, resumeOnCancel } = state;
    const currentPage = book?.currentPage;

    useEffect(() => {
        if (currentPage !== undefined) {
            dispatch({
                type: READING_SESSION_STOP_EVENTS.BOOK_SYNCED,
                currentPage,
            });
        }
    }, [currentPage]);

    const handleStopClick = () => {
        if (isBusy) {
            return;
        }

        if (!isPaused) {
            void pauseSession();
        }

        dispatch({
            type: READING_SESSION_STOP_EVENTS.STOP_REQUESTED,
            wasPaused: isPaused,
        });
    };

    const handleStopCancel = () => {
        if (resumeOnCancel) {
            resumeSession();
        }

        dispatch({ type: READING_SESSION_STOP_EVENTS.STOP_CANCELLED });
    };

    const handleConfirmStop = async () => {
        if (!book) {
            return;
        }

        const pageNum = parseInt(endPage, 10);
        if (Number.isNaN(pageNum) || pageNum < 0) {
            return;
        }

        if (book.pageCount && pageNum > book.pageCount) {
            toast(createAppToast({
                title: t('readingSession.alerts.pageExceeds', { total: book.pageCount }),
                status: 'warning',
                duration: 5000,
            }));
            return;
        }

        const startPage = book.currentPage || 0;
        const pagesRead = pageNum - startPage;
        const normalizedPagesRead = pagesRead > 0 ? pagesRead : 0;

        setHasStopped(true);
        const success = await stopSession(new Date(), pageNum);

        if (success) {
            onStopSuccess({
                startPage,
                endPage: pageNum,
                pagesRead: normalizedPagesRead,
            });
            return;
        }

        setHasStopped(false);
        if (resumeOnCancel) {
            resumeSession();
        }
        dispatch({ type: READING_SESSION_STOP_EVENTS.STOP_FAILED });
        toast(createAppToast({
            title: t('readingSession.alerts.stopError'),
            status: 'error',
            duration: 5000,
        }));
    };

    return {
        showStopConfirm,
        endPage,
        setEndPage: (value: string) => dispatch({ type: READING_SESSION_STOP_EVENTS.END_PAGE_CHANGED, value }),
        handleStopClick,
        handleStopCancel,
        handleConfirmStop,
    };
};
