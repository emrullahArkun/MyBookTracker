import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/model';
import { useReadingSessionContext } from './ReadingSessionContext';
import { useReadingSessionBook } from './useReadingSessionBook';
import { useReadingSessionLifecycle } from './useReadingSessionLifecycle';
import { useReadingSessionStopFlow } from './useReadingSessionStopFlow';

export const useReadingSessionPageLogic = (bookIdParam?: string) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = useAuth();
    const toast = useToast();
    const bookId = bookIdParam ? Number(bookIdParam) : null;
    const normalizedBookId = Number.isInteger(bookId) && bookId > 0 ? bookId : null;

    // Global Session logic
    const {
        activeSession,
        sessionPhase,
        isBusy,
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

    const [hasStopped, setHasStopped] = useState(false);

    const { book, fetchingBook } = useReadingSessionBook({ bookId: normalizedBookId, token, toast, t });

    useReadingSessionLifecycle({
        activeSession,
        sessionPhase,
        book,
        bookId: normalizedBookId,
        hasStopped,
        startSession,
        navigate,
        toast,
        t,
    });

    const {
        showStopConfirm,
        endPage,
        setEndPage,
        handleStopClick,
        handleStopCancel,
        handleConfirmStop,
    } = useReadingSessionStopFlow({
        book,
        isPaused,
        isBusy,
        pauseSession,
        resumeSession,
        stopSession,
        navigate,
        toast,
        t,
        setHasStopped,
    });

    return {
        book,
        fetchingBook,
        activeSession,
        sessionLoading,
        sessionPhase,
        isBusy,
        formattedTime,
        isPaused,
        resumeSession,
        pauseSession,
        isController,
        takeControl,
        showStopConfirm,
        endPage,
        setEndPage,
        handleStopClick,
        handleStopCancel,
        handleConfirmStop
    };
};
