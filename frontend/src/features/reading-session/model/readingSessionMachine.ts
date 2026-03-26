import type { ReadingSession, ReadingSessionPhase, ReadingSessionState } from '../../../shared/types/sessions';

export const READING_SESSION_PHASES = {
    BOOTING: 'booting',
    IDLE: 'idle',
    STARTING: 'starting',
    ACTIVE: 'active',
    PAUSED: 'paused',
    PAUSING: 'pausing',
    RESUMING: 'resuming',
    STOPPING: 'stopping',
} as const satisfies Record<string, ReadingSessionPhase>;

export const READING_SESSION_EVENTS = {
    SESSION_CLEARED: 'SESSION_CLEARED',
    REFRESH_SUCCEEDED: 'REFRESH_SUCCEEDED',
    REFRESH_FAILED: 'REFRESH_FAILED',
    START_REQUESTED: 'START_REQUESTED',
    START_SUCCEEDED: 'START_SUCCEEDED',
    START_FAILED: 'START_FAILED',
    PAUSE_REQUESTED: 'PAUSE_REQUESTED',
    PAUSE_SUCCEEDED: 'PAUSE_SUCCEEDED',
    PAUSE_FAILED: 'PAUSE_FAILED',
    RESUME_REQUESTED: 'RESUME_REQUESTED',
    RESUME_SUCCEEDED: 'RESUME_SUCCEEDED',
    RESUME_FAILED: 'RESUME_FAILED',
    STOP_REQUESTED: 'STOP_REQUESTED',
    STOP_SUCCEEDED: 'STOP_SUCCEEDED',
    STOP_FAILED: 'STOP_FAILED',
} as const;

type ReadingSessionEvent =
    | { type: typeof READING_SESSION_EVENTS.SESSION_CLEARED }
    | { type: typeof READING_SESSION_EVENTS.REFRESH_SUCCEEDED; session?: ReadingSession | null }
    | { type: typeof READING_SESSION_EVENTS.REFRESH_FAILED }
    | { type: typeof READING_SESSION_EVENTS.START_REQUESTED }
    | { type: typeof READING_SESSION_EVENTS.START_SUCCEEDED; session: ReadingSession | null }
    | { type: typeof READING_SESSION_EVENTS.START_FAILED }
    | { type: typeof READING_SESSION_EVENTS.PAUSE_REQUESTED }
    | { type: typeof READING_SESSION_EVENTS.PAUSE_SUCCEEDED; session: ReadingSession | null }
    | { type: typeof READING_SESSION_EVENTS.PAUSE_FAILED }
    | { type: typeof READING_SESSION_EVENTS.RESUME_REQUESTED }
    | { type: typeof READING_SESSION_EVENTS.RESUME_SUCCEEDED; session: ReadingSession | null }
    | { type: typeof READING_SESSION_EVENTS.RESUME_FAILED }
    | { type: typeof READING_SESSION_EVENTS.STOP_REQUESTED }
    | { type: typeof READING_SESSION_EVENTS.STOP_SUCCEEDED }
    | { type: typeof READING_SESSION_EVENTS.STOP_FAILED };

export const createInitialReadingSessionState = (): ReadingSessionState => ({
    activeSession: null,
    phase: READING_SESSION_PHASES.BOOTING,
});

const resolveSettledPhase = (session: ReadingSession | null): ReadingSessionPhase => {
    if (!session) {
        return READING_SESSION_PHASES.IDLE;
    }

    return session.status === 'PAUSED'
        ? READING_SESSION_PHASES.PAUSED
        : READING_SESSION_PHASES.ACTIVE;
};

const settleSessionState = (state: ReadingSessionState, session: ReadingSession | null): ReadingSessionState => ({
    ...state,
    activeSession: session,
    phase: resolveSettledPhase(session),
});

export const readingSessionReducer = (
    state: ReadingSessionState,
    event: ReadingSessionEvent
): ReadingSessionState => {
    switch (event.type) {
        case READING_SESSION_EVENTS.SESSION_CLEARED:
            return {
                activeSession: null,
                phase: READING_SESSION_PHASES.IDLE,
            };

        case READING_SESSION_EVENTS.REFRESH_SUCCEEDED:
            return settleSessionState(state, event.session ?? null);

        case READING_SESSION_EVENTS.REFRESH_FAILED:
            return state.phase === READING_SESSION_PHASES.BOOTING
                ? { activeSession: null, phase: READING_SESSION_PHASES.IDLE }
                : state;

        case READING_SESSION_EVENTS.START_REQUESTED:
            return { ...state, phase: READING_SESSION_PHASES.STARTING };

        case READING_SESSION_EVENTS.START_SUCCEEDED:
            return settleSessionState(state, event.session);

        case READING_SESSION_EVENTS.START_FAILED:
            return settleSessionState(state, state.activeSession);

        case READING_SESSION_EVENTS.PAUSE_REQUESTED:
            return { ...state, phase: READING_SESSION_PHASES.PAUSING };

        case READING_SESSION_EVENTS.PAUSE_SUCCEEDED:
            return settleSessionState(state, event.session);

        case READING_SESSION_EVENTS.PAUSE_FAILED:
            return settleSessionState(state, state.activeSession);

        case READING_SESSION_EVENTS.RESUME_REQUESTED:
            return { ...state, phase: READING_SESSION_PHASES.RESUMING };

        case READING_SESSION_EVENTS.RESUME_SUCCEEDED:
            return settleSessionState(state, event.session);

        case READING_SESSION_EVENTS.RESUME_FAILED:
            return settleSessionState(state, state.activeSession);

        case READING_SESSION_EVENTS.STOP_REQUESTED:
            return { ...state, phase: READING_SESSION_PHASES.STOPPING };

        case READING_SESSION_EVENTS.STOP_SUCCEEDED:
            return {
                activeSession: null,
                phase: READING_SESSION_PHASES.IDLE,
            };

        case READING_SESSION_EVENTS.STOP_FAILED:
            return settleSessionState(state, state.activeSession);

        default:
            return state;
    }
};

export const isBusyReadingSessionPhase = (phase: ReadingSessionPhase): boolean => (
    phase === READING_SESSION_PHASES.STARTING
    || phase === READING_SESSION_PHASES.PAUSING
    || phase === READING_SESSION_PHASES.RESUMING
    || phase === READING_SESSION_PHASES.STOPPING
);
