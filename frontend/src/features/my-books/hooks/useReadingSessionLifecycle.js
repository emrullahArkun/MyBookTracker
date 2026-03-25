import { useEffect, useRef, useState } from 'react';
import { ROUTES } from '../../../app/routes';

export const useReadingSessionLifecycle = ({
    activeSession,
    book,
    bookId,
    sessionLoading,
    hasStopped,
    startSession,
    navigate,
    toast,
    t,
}) => {
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

        if (hasSeenActiveSessionRef.current && !hasStopped) {
            toast({
                title: t('readingSession.alerts.endedRemote'),
                status: 'info',
                duration: 5000,
                isClosable: true,
            });
            navigate(ROUTES.MY_BOOKS);
        }
    }, [activeSession, hasStopped, navigate, t, toast]);

    useEffect(() => {
        if (sessionLoading || activeSession || !book || hasStopped || startFailed) {
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
    }, [sessionLoading, activeSession, book, hasStopped, startFailed, startSession, bookId, toast, t]);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (!activeSession) {
                return;
            }
            event.preventDefault();
            event.returnValue = '';
        };

        const handlePopState = (event) => {
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
