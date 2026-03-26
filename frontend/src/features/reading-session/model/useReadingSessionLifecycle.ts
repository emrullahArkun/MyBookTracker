import { useEffect, useRef, useState } from 'react';
import type { UseToastOptions } from '@chakra-ui/react';
import { ROUTES } from '../../../app/router/routes';
import { READING_SESSION_PHASES } from './readingSessionMachine';
import type { Book } from '../../../shared/types/books';
import type { ReadingSession, ReadingSessionPhase } from '../../../shared/types/sessions';

type TranslationValues = Record<string, string | number>;

type TranslationFn = (key: string, values?: TranslationValues) => string;

type ToastFn = (options?: UseToastOptions) => void;

type LifecycleBook = Pick<Book, 'id'>;

type UseReadingSessionLifecycleParams = {
    activeSession: ReadingSession | null;
    sessionPhase: ReadingSessionPhase;
    book: LifecycleBook | null;
    bookId: number | null;
    hasStopped: boolean;
    startSession: (bookId: number) => Promise<boolean>;
    navigate: (to: string) => void;
    toast: ToastFn;
    t: TranslationFn;
};

export const useReadingSessionLifecycle = ({
    activeSession,
    sessionPhase,
    book,
    bookId,
    hasStopped,
    startSession,
    navigate,
    toast,
    t,
}: UseReadingSessionLifecycleParams) => {
    const [startFailed, setStartFailed] = useState(false);
    const hasSeenActiveSessionRef = useRef(false);
    const isStartingRef = useRef(false);

    useEffect(() => {
        if (activeSession && book && activeSession.bookId !== book.id) {
            toast({
                title: t('readingSession.alerts.mismatch'),
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
            navigate(ROUTES.MY_BOOKS);
        }
    }, [activeSession, book, navigate, t, toast]);

    useEffect(() => {
        if (activeSession) {
            hasSeenActiveSessionRef.current = true;
            return;
        }

        if (sessionPhase === READING_SESSION_PHASES.IDLE && hasSeenActiveSessionRef.current && !hasStopped) {
            toast({
                title: t('readingSession.alerts.endedRemote'),
                status: 'info',
                duration: 5000,
                isClosable: true,
            });
            navigate(ROUTES.MY_BOOKS);
        }
    }, [activeSession, sessionPhase, hasStopped, navigate, t, toast]);

    useEffect(() => {
        if (
            sessionPhase !== READING_SESSION_PHASES.IDLE
            || activeSession
            || bookId === null
            || !book
            || hasStopped
            || startFailed
        ) {
            return;
        }
        if (isStartingRef.current) {
            return;
        }

        isStartingRef.current = true;
        startSession(bookId)
            .then((success) => {
                if (!success) {
                    setStartFailed(true);
                    toast({
                        title: t('readingSession.alerts.startError'),
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                    });
                }
            })
            .finally(() => {
                isStartingRef.current = false;
            });
    }, [sessionPhase, activeSession, book, hasStopped, startFailed, startSession, bookId, toast, t]);

    useEffect(() => {
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            if (!activeSession) {
                return;
            }
            event.preventDefault();
            event.returnValue = '';
        };

        const handlePopState = (event: PopStateEvent) => {
            if (!activeSession) {
                return;
            }
            event.preventDefault();
            window.history.pushState(null, '', window.location.href);
            toast({
                title: t('readingSession.alerts.exitWarning'),
                status: 'warning',
                duration: 3000,
                isClosable: true,
                position: 'top',
            });
        };

        if (activeSession) {
            window.history.pushState(null, '', window.location.href);
            window.addEventListener('beforeunload', handleBeforeUnload);
            window.addEventListener('popstate', handlePopState);
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [activeSession, t, toast]);

    return { startFailed };
};
