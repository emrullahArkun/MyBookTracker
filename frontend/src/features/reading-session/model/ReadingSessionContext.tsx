import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/model';
import { sessionsApi } from '../api';
import { useControllerLock } from './useControllerLock';
import {
    createInitialReadingSessionState,
    isBusyReadingSessionPhase,
    READING_SESSION_EVENTS,
    READING_SESSION_PHASES,
    readingSessionReducer,
} from './readingSessionMachine';
import { useSessionTimer } from './useSessionTimer';
import { useSessionBroadcast } from './useSessionBroadcast';
import type { ReadingSessionContextValue } from '../../../shared/types/sessions';

const ReadingSessionContext = createContext<ReadingSessionContextValue | undefined>(undefined);

type ReadingSessionProviderProps = {
    children: ReactNode;
};

export const ReadingSessionProvider = ({ children }: ReadingSessionProviderProps) => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [state, dispatch] = useReducer(readingSessionReducer, undefined, createInitialReadingSessionState);

    const { activeSession, phase: sessionPhase } = state;
    const loading = sessionPhase === READING_SESSION_PHASES.BOOTING;
    const isPaused = sessionPhase === READING_SESSION_PHASES.PAUSED;
    const isBusy = isBusyReadingSessionPhase(sessionPhase);

    const refreshSession = useCallback(async () => {
        if (!token) {
            return;
        }

        try {
            const session = await sessionsApi.getActive();
            dispatch({ type: READING_SESSION_EVENTS.REFRESH_SUCCEEDED, session });
        } catch {
            dispatch({ type: READING_SESSION_EVENTS.REFRESH_FAILED });
        }
    }, [token]);

    const { broadcastUpdate } = useSessionBroadcast(token, refreshSession);
    const { elapsedSeconds, formattedTime } = useSessionTimer(activeSession);

    useEffect(() => {
        if (!token) {
            dispatch({ type: READING_SESSION_EVENTS.SESSION_CLEARED });
            return;
        }

        void refreshSession();
    }, [token, refreshSession]);

    const { isController, takeControl } = useControllerLock();

    const startSession = useCallback(async (bookId: number) => {
        dispatch({ type: READING_SESSION_EVENTS.START_REQUESTED });
        try {
            const session = await sessionsApi.start(bookId);
            dispatch({ type: READING_SESSION_EVENTS.START_SUCCEEDED, session: session ?? null });
            takeControl();
            broadcastUpdate();
            return true;
        } catch {
            dispatch({ type: READING_SESSION_EVENTS.START_FAILED });
            return false;
        }
    }, [takeControl, broadcastUpdate]);

    const stopSession = useCallback(async (endTime: Date | null, endPage?: number) => {
        dispatch({ type: READING_SESSION_EVENTS.STOP_REQUESTED });
        try {
            await sessionsApi.stop(endTime, endPage);
            dispatch({ type: READING_SESSION_EVENTS.STOP_SUCCEEDED });
            broadcastUpdate();
            queryClient.invalidateQueries({ queryKey: ['myBooksSection'] });
            queryClient.invalidateQueries({ queryKey: ['myBooks'] });
            queryClient.invalidateQueries({ queryKey: ['book'] });
            queryClient.invalidateQueries({ queryKey: ['bookSessions'] });
            queryClient.invalidateQueries({ queryKey: ['stats'] });
            queryClient.invalidateQueries({ queryKey: ['goals'] });
            queryClient.invalidateQueries({ queryKey: ['home'] });
            return true;
        } catch {
            dispatch({ type: READING_SESSION_EVENTS.STOP_FAILED });
            return false;
        }
    }, [broadcastUpdate, queryClient]);

    const pauseSession = useCallback(async () => {
        if (!isController || isBusy) return;
        dispatch({ type: READING_SESSION_EVENTS.PAUSE_REQUESTED });
        try {
            const session = await sessionsApi.pause();
            dispatch({ type: READING_SESSION_EVENTS.PAUSE_SUCCEEDED, session: session ?? null });
            broadcastUpdate();
        } catch {
            dispatch({ type: READING_SESSION_EVENTS.PAUSE_FAILED });
        }
    }, [isController, isBusy, broadcastUpdate]);

    const resumeSession = useCallback(async () => {
        if (!isController || isBusy) return;
        dispatch({ type: READING_SESSION_EVENTS.RESUME_REQUESTED });
        try {
            const session = await sessionsApi.resume();
            dispatch({ type: READING_SESSION_EVENTS.RESUME_SUCCEEDED, session: session ?? null });
            broadcastUpdate();
        } catch {
            dispatch({ type: READING_SESSION_EVENTS.RESUME_FAILED });
        }
    }, [isController, isBusy, broadcastUpdate]);

    const value = useMemo<ReadingSessionContextValue>(() => ({
        activeSession,
        loading,
        sessionPhase,
        isBusy,
        elapsedSeconds,
        formattedTime,
        isPaused,
        startSession,
        stopSession,
        pauseSession,
        resumeSession,
        isController,
        takeControl,
    }), [
        activeSession,
        loading,
        sessionPhase,
        isBusy,
        elapsedSeconds,
        formattedTime,
        isPaused,
        startSession,
        stopSession,
        pauseSession,
        resumeSession,
        isController,
        takeControl,
    ]);

    return (
        <ReadingSessionContext.Provider value={value}>
            {children}
        </ReadingSessionContext.Provider>
    );
};

export const useReadingSessionContext = (): ReadingSessionContextValue => {
    const context = useContext(ReadingSessionContext);
    if (!context) {
        throw new Error('useReadingSessionContext must be used within a ReadingSessionProvider');
    }
    return context;
};
