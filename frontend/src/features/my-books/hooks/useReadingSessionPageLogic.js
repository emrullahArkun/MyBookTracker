import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useReadingSessionContext } from '../../../context/ReadingSessionContext';
import { booksApi } from '../../books/api';
import { useToast } from '@chakra-ui/react';

export const useReadingSessionPageLogic = (bookId) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = useAuth();
    const toast = useToast();

    // Global Session logic
    const {
        activeSession,
        startSession,
        stopSession,
        formattedTime,
        loading: sessionLoading,
        isPaused,
        pauseSession,
        resumeSession,
        isController,
        takeControl
    } = useReadingSessionContext();

    // Local State
    const [book, setBook] = useState(null);
    const [fetchingBook, setFetchingBook] = useState(true);
    const [note, setNote] = useState('');
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [endPage, setEndPage] = useState('');
    const [hasStopped, setHasStopped] = useState(false);
    const [wasActive, setWasActive] = useState(false);

    // 1. Fetch book details
    useEffect(() => {
        if (!token) return;
        const fetchBook = async () => {
            try {
                const data = await booksApi.getById(bookId);
                if (data) {
                    setBook(data);
                    if (data.currentPage) setEndPage(data.currentPage);
                }
            } catch {
                toast({
                    title: t('readingSession.alerts.fetchError', 'Could not load book'),
                    status: 'error',
                    duration: 5000,
                    isClosable: true
                });
            } finally {
                setFetchingBook(false);
            }
        };
        fetchBook();
    }, [bookId, token, t, toast]);

    // 2. Check for session mismatch
    useEffect(() => {
        if (activeSession && book && activeSession.bookId !== book.id) {
            toast({
                title: t('readingSession.alerts.mismatch'),
                status: 'warning',
                duration: 5000,
                isClosable: true
            });
            navigate('/my-books');
        }
    }, [activeSession, book, navigate, t, toast]);

    useEffect(() => {
        if (activeSession) {
            setWasActive(true);
        } else if (wasActive && !activeSession && !hasStopped) {
            toast({
                title: t('readingSession.alerts.endedRemote'),
                status: 'info',
                duration: 5000,
                isClosable: true
            });
            navigate('/my-books');
        }
    }, [activeSession, wasActive, hasStopped, navigate, t, toast]);

    // 4. Auto-start session
    const isStartingRef = useRef(false);
    useEffect(() => {
        if (!sessionLoading && !activeSession && book && !hasStopped && !wasActive) {
            if (isStartingRef.current) return;
            isStartingRef.current = true;

            startSession(bookId).finally(() => {
                isStartingRef.current = false;
            });
        }
    }, [sessionLoading, activeSession, book, bookId, startSession, hasStopped, wasActive]);

    // 5. Navigation Guard
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (activeSession) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        const handlePopState = (e) => {
            if (activeSession) {
                e.preventDefault();
                window.history.pushState(null, '', window.location.href);
                toast({
                    title: t('readingSession.alerts.exitWarning'),
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                    position: 'top'
                });
            }
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

    // Handlers
    const handleBackClick = () => {
        if (activeSession) {
            // Signal to UI to show confirmation
            return true; // Indicates we need confirmation
        } else {
            navigate('/my-books');
            return false;
        }
    };

    const handleStopClick = () => {
        if (!isPaused) {
            pauseSession();
        }
        setShowStopConfirm(true);
    };

    const handleStopCancel = () => {
        setShowStopConfirm(false);
        resumeSession();
    };

    const handleConfirmStop = async () => {
        const pageNum = parseInt(endPage, 10);
        if (isNaN(pageNum) || pageNum < 0) return;

        if (book.pageCount && pageNum > book.pageCount) {
            toast({
                title: t('readingSession.alerts.pageExceeds', 'Page number cannot exceed total pages ({{total}}).', { total: book.pageCount }),
                status: 'warning',
                duration: 5000,
                isClosable: true
            });
            return;
        }

        const startPage = book.currentPage || 0;
        const pagesRead = pageNum - startPage;

        setHasStopped(true);
        const success = await stopSession(new Date(), pageNum);
        if (success) {
            toast({
                title: t('readingSession.alerts.summary', { pages: pagesRead > 0 ? pagesRead : 0 }),
                status: 'success',
                duration: 5000,
                isClosable: true
            });
            navigate('/my-books');
        }
    };

    return {
        book,
        fetchingBook,
        note,
        setNote,
        activeSession,
        sessionLoading,
        formattedTime,
        isPaused,
        resumeSession,
        pauseSession,
        isController,
        takeControl,
        showStopConfirm,
        endPage,
        setEndPage,
        handleBackClick,
        handleStopClick,
        handleStopCancel,
        handleConfirmStop
    };
};
