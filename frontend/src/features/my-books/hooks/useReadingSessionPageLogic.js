import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useReadingSessionContext } from '../../../context/ReadingSessionContext';
import { useToast } from '@chakra-ui/react';
import { useReadingSessionBook } from './useReadingSessionBook';
import { useReadingSessionLifecycle } from './useReadingSessionLifecycle';
import { useReadingSessionStopFlow } from './useReadingSessionStopFlow';

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

    const [hasStopped, setHasStopped] = useState(false);

    const { book, fetchingBook } = useReadingSessionBook({ bookId, token, toast, t });

    useReadingSessionLifecycle({
        activeSession,
        book,
        bookId,
        sessionLoading,
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
