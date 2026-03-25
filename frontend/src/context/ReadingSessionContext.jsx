import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '../features/reading-sessions/api/sessionsApi';
import { useControllerLock } from '../features/reading-sessions/hooks/useControllerLock';
import { useSessionTimer } from '../features/reading-sessions/hooks/useSessionTimer';
import { useSessionBroadcast } from '../features/reading-sessions/hooks/useSessionBroadcast';

const ReadingSessionContext = createContext(null);

export const ReadingSessionProvider = ({ children }) => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [activeSession, setActiveSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const isPaused = activeSession?.status === 'PAUSED';

    const refreshSession = useCallback(async () => {
        if (!token) return;
        try {
            const session = await sessionsApi.getActive();
            setActiveSession(session);
        } catch {
            // Session refresh failed silently — will retry on next trigger
        }
    }, [token]);

    // Cross-tab broadcast
    const { broadcastUpdate } = useSessionBroadcast(token, refreshSession);

    // Timer
    const { elapsedSeconds, formattedTime } = useSessionTimer(activeSession);

    // Fetch active session on mount/token change
    useEffect(() => {
        if (!token) {
            setActiveSession(null);
            setLoading(false);
            return;
        }
        refreshSession().finally(() => setLoading(false));
    }, [token, refreshSession]);

    // Controller Lock
    const { isController, takeControl } = useControllerLock(activeSession);

    const startSession = useCallback(async (bookId) => {
        try {
            const session = await sessionsApi.start(bookId);
            setActiveSession(session);
            takeControl();
            broadcastUpdate();
            return true;
        } catch {
            return false;
        }
    }, [takeControl, broadcastUpdate]);

    const stopSession = useCallback(async (endTime, endPage) => {
        try {
            await sessionsApi.stop(endTime, endPage);
            setActiveSession(null);
            broadcastUpdate();
            
            // Invalidate caches to reflect the newly read pages immediately
            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            queryClient.invalidateQueries({ queryKey: ['book'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            return true;
        } catch {
            return false;
        }
    }, [broadcastUpdate, queryClient]);

    const pauseSession = useCallback(async () => {
        if (!isController) return;
        try {
            const session = await sessionsApi.pause();
            setActiveSession(session);
            broadcastUpdate();
        } catch {
            // Pause failed — session state unchanged
        }
    }, [isController, broadcastUpdate]);

    const resumeSession = useCallback(async () => {
        if (!isController) return;
        try {
            const session = await sessionsApi.resume();
            setActiveSession(session);
            broadcastUpdate();
        } catch {
            // Resume failed — session state unchanged
        }
    }, [isController, broadcastUpdate]);

    const value = useMemo(() => ({
        activeSession,
        loading,
        elapsedSeconds,
        formattedTime,
        isPaused,
        startSession,
        stopSession,
        pauseSession,
        resumeSession,
        isController,
        takeControl
    }), [activeSession, loading, elapsedSeconds, formattedTime, isPaused, startSession, stopSession, pauseSession, resumeSession, isController, takeControl]);

    return (
        <ReadingSessionContext.Provider value={value}>
            {children}
        </ReadingSessionContext.Provider>
    );
};

export const useReadingSessionContext = () => {
    const context = useContext(ReadingSessionContext);
    if (!context) {
        throw new Error('useReadingSessionContext must be used within a ReadingSessionProvider');
    }
    return context;
};
