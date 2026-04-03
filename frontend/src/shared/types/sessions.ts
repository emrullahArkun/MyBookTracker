export type SessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | string;

export type ReadingSession = {
    id: number;
    bookId: number;
    startTime: string;
    endTime: string | null;
    status: SessionStatus;
    startPage: number | null;
    endPage: number | null;
    pagesRead: number | null;
    pausedMillis: number | null;
    pausedAt: string | null;
};

export type StartSessionRequest = {
    bookId: number;
};

export type StopSessionRequest = {
    endTime?: string;
    endPage?: number;
};

export type ExcludeTimeRequest = {
    millis: number;
};

export type ReadingSessionPhase =
    | 'booting'
    | 'idle'
    | 'starting'
    | 'active'
    | 'paused'
    | 'pausing'
    | 'resuming'
    | 'stopping';

export type ReadingSessionState = {
    activeSession: ReadingSession | null;
    phase: ReadingSessionPhase;
};

export type ReadingSessionContextValue = {
    activeSession: ReadingSession | null;
    loading: boolean;
    sessionPhase: ReadingSessionPhase;
    isBusy: boolean;
    isPaused: boolean;
    startSession: (bookId: number) => Promise<boolean>;
    stopSession: (endTime: Date | null, endPage?: number) => Promise<boolean>;
    pauseSession: () => Promise<void>;
    resumeSession: () => Promise<void>;
    isController: boolean;
    takeControl: () => void;
};
