import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useSessionTimer } from './useSessionTimer';
import { useReadingSessionContext } from './ReadingSessionContext';

type SessionTimerContextValue = {
    elapsedSeconds: number;
    formattedTime: string;
};

const SessionTimerContext = createContext<SessionTimerContextValue | undefined>(undefined);

export const SessionTimerProvider = ({ children }: { children: ReactNode }) => {
    const { activeSession } = useReadingSessionContext();
    const { elapsedSeconds, formattedTime } = useSessionTimer(activeSession);

    const value = useMemo(() => ({
        elapsedSeconds,
        formattedTime,
    }), [elapsedSeconds, formattedTime]);

    return (
        <SessionTimerContext.Provider value={value}>
            {children}
        </SessionTimerContext.Provider>
    );
};

export const useSessionTimerContext = (): SessionTimerContextValue => {
    const context = useContext(SessionTimerContext);
    if (!context) {
        throw new Error('useSessionTimerContext must be used within a SessionTimerProvider');
    }
    return context;
};
