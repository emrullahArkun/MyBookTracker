import { useEffect, useState } from 'react';
import { ROUTES } from '../../../app/routes';

export const useReadingSessionStopFlow = ({
    book,
    isPaused,
    pauseSession,
    resumeSession,
    stopSession,
    navigate,
    toast,
    t,
    setHasStopped,
}) => {
    const [showStopConfirm, setShowStopConfirm] = useState(false);
    const [endPage, setEndPage] = useState('');
    const [resumeOnCancel, setResumeOnCancel] = useState(false);

    useEffect(() => {
        if (book) {
            setEndPage(String(book.currentPage ?? ''));
        }
    }, [book]);

    const handleStopClick = () => {
        if (!isPaused) {
            pauseSession();
            setResumeOnCancel(true);
        } else {
            setResumeOnCancel(false);
        }
        setShowStopConfirm(true);
    };

    const handleStopCancel = () => {
        setShowStopConfirm(false);
        if (resumeOnCancel) {
            resumeSession();
        }
        setResumeOnCancel(false);
    };

    const handleConfirmStop = async () => {
        const pageNum = parseInt(endPage, 10);
        if (Number.isNaN(pageNum) || pageNum < 0) {
            return;
        }

        if (book.pageCount && pageNum > book.pageCount) {
            toast({
                title: t('readingSession.alerts.pageExceeds', { total: book.pageCount }),
                status: 'warning',
                duration: 5000,
                isClosable: true,
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
                isClosable: true,
            });
            navigate(ROUTES.MY_BOOKS);
            return;
        }

        setHasStopped(false);
        setShowStopConfirm(false);
        if (resumeOnCancel) {
            resumeSession();
        }
        setResumeOnCancel(false);
        toast({
            title: t('readingSession.alerts.stopError'),
            status: 'error',
            duration: 5000,
            isClosable: true,
        });
    };

    return {
        showStopConfirm,
        endPage,
        setEndPage,
        handleStopClick,
        handleStopCancel,
        handleConfirmStop,
    };
};
