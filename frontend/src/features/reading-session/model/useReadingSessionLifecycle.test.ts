import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useReadingSessionLifecycle } from './useReadingSessionLifecycle';
import { READING_SESSION_PHASES } from './readingSessionMachine';
import { ROUTES } from '../../../app/router/routes';

const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockT = vi.fn((key: string) => key);
const mockStartSession = vi.fn();

const makeSession = (bookId: number) => ({
    id: 1,
    bookId,
    startTime: '2026-01-01T10:00:00Z',
    endTime: null,
    status: 'ACTIVE' as const,
    pagesRead: 0,
});

const makeBook = (id: number) => ({ id });

const defaultProps = {
    activeSession: null,
    sessionPhase: READING_SESSION_PHASES.IDLE,
    book: null,
    bookId: null,
    hasStopped: false,
    startSession: mockStartSession,
    navigate: mockNavigate,
    toast: mockToast,
    t: mockT,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('useReadingSessionLifecycle', () => {
    describe('Effect 3: auto-start', () => {
        it('calls startSession when IDLE, no active session, book loaded, and hasStopped is false', async () => {
            mockStartSession.mockResolvedValue(true);

            renderHook(() =>
                useReadingSessionLifecycle({
                    ...defaultProps,
                    sessionPhase: READING_SESSION_PHASES.IDLE,
                    activeSession: null,
                    book: makeBook(42),
                    bookId: 42,
                    hasStopped: false,
                    startSession: mockStartSession,
                })
            );

            await waitFor(() => {
                expect(mockStartSession).toHaveBeenCalledTimes(1);
                expect(mockStartSession).toHaveBeenCalledWith(42);
            });
        });

        it('does NOT call startSession when hasStopped is true', async () => {
            mockStartSession.mockResolvedValue(true);

            renderHook(() =>
                useReadingSessionLifecycle({
                    ...defaultProps,
                    sessionPhase: READING_SESSION_PHASES.IDLE,
                    activeSession: null,
                    book: makeBook(42),
                    bookId: 42,
                    hasStopped: true,
                    startSession: mockStartSession,
                })
            );

            await act(async () => {
                await Promise.resolve();
            });

            expect(mockStartSession).not.toHaveBeenCalled();
        });

        it('does NOT call startSession again after startFailed becomes true', async () => {
            mockStartSession.mockResolvedValue(false);

            const props = {
                ...defaultProps,
                sessionPhase: READING_SESSION_PHASES.IDLE,
                activeSession: null,
                book: makeBook(42),
                bookId: 42,
                hasStopped: false,
                startSession: mockStartSession,
                toast: mockToast,
                t: mockT,
            };

            const { result } = renderHook(() => useReadingSessionLifecycle(props));

            await waitFor(() => {
                expect(result.current.startFailed).toBe(true);
            });

            const callCount = mockStartSession.mock.calls.length;

            // Allow additional renders to settle
            await act(async () => {
                await Promise.resolve();
            });

            expect(mockStartSession).toHaveBeenCalledTimes(callCount);
        });

        it('sets startFailed and shows an error toast when startSession returns false', async () => {
            mockStartSession.mockResolvedValue(false);

            const { result } = renderHook(() =>
                useReadingSessionLifecycle({
                    ...defaultProps,
                    sessionPhase: READING_SESSION_PHASES.IDLE,
                    activeSession: null,
                    book: makeBook(42),
                    bookId: 42,
                    hasStopped: false,
                    startSession: mockStartSession,
                    toast: mockToast,
                    t: mockT,
                })
            );

            await waitFor(() => {
                expect(result.current.startFailed).toBe(true);
            });

            expect(mockToast).toHaveBeenCalledTimes(1);
            const toastArg = mockToast.mock.calls[0][0];
            expect(toastArg).toMatchObject({ duration: 5000 });
            expect(mockT).toHaveBeenCalledWith('readingSession.alerts.startError');
        });
    });

    describe('Effect 1: session book mismatch', () => {
        it('shows a warning toast and navigates to MY_BOOKS when activeSession.bookId does not match book.id', () => {
            const session = makeSession(99);
            const book = makeBook(42);

            renderHook(() =>
                useReadingSessionLifecycle({
                    ...defaultProps,
                    activeSession: session,
                    book,
                    bookId: 42,
                    sessionPhase: READING_SESSION_PHASES.ACTIVE,
                    toast: mockToast,
                    navigate: mockNavigate,
                    t: mockT,
                })
            );

            expect(mockToast).toHaveBeenCalledTimes(1);
            const toastArg = mockToast.mock.calls[0][0];
            expect(toastArg).toMatchObject({ duration: 5000 });
            expect(mockT).toHaveBeenCalledWith('readingSession.alerts.mismatch');
            expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MY_BOOKS);
        });
    });

    describe('Effect 2: session ended remotely', () => {
        it('shows an info toast and navigates to MY_BOOKS when activeSession goes null after being seen and hasStopped is false', async () => {
            mockStartSession.mockResolvedValue(true);
            const session = makeSession(42);
            const book = makeBook(42);

            const props = {
                ...defaultProps,
                activeSession: session,
                book,
                bookId: 42,
                sessionPhase: READING_SESSION_PHASES.ACTIVE,
                hasStopped: false,
                toast: mockToast,
                navigate: mockNavigate,
                t: mockT,
            };

            const { rerender } = renderHook(
                (p: typeof props) => useReadingSessionLifecycle(p),
                { initialProps: props }
            );

            // At this point the hook has seen the active session
            expect(mockNavigate).not.toHaveBeenCalled();

            await act(async () => {
                rerender({
                    ...props,
                    activeSession: null,
                    sessionPhase: READING_SESSION_PHASES.IDLE,
                });
            });

            // The info toast + possibly the auto-start (which succeeds silently)
            expect(mockToast).toHaveBeenCalledTimes(1);
            const toastArg = mockToast.mock.calls[0][0];
            expect(toastArg).toMatchObject({ duration: 5000 });
            expect(mockT).toHaveBeenCalledWith('readingSession.alerts.endedRemote');
            expect(mockNavigate).toHaveBeenCalledWith(ROUTES.MY_BOOKS);
        });
    });

    describe('Effect 4: navigation guards', () => {
        it('registers beforeunload and popstate listeners when activeSession exists', () => {
            const addSpy = vi.spyOn(window, 'addEventListener');
            const session = makeSession(42);
            const book = makeBook(42);

            renderHook(() =>
                useReadingSessionLifecycle({
                    ...defaultProps,
                    activeSession: session,
                    book,
                    bookId: 42,
                    sessionPhase: READING_SESSION_PHASES.ACTIVE,
                })
            );

            expect(addSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
            expect(addSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
            addSpy.mockRestore();
        });

        it('does not register listeners when activeSession is null', () => {
            const addSpy = vi.spyOn(window, 'addEventListener');

            renderHook(() =>
                useReadingSessionLifecycle({
                    ...defaultProps,
                    activeSession: null,
                    book: null,
                    bookId: null,
                    sessionPhase: READING_SESSION_PHASES.IDLE,
                    hasStopped: true,
                })
            );

            const beforeunloadCalls = addSpy.mock.calls.filter(([type]) => type === 'beforeunload');
            expect(beforeunloadCalls).toHaveLength(0);
            addSpy.mockRestore();
        });

        it('beforeunload handler calls preventDefault on active session', () => {
            const session = makeSession(42);
            const book = makeBook(42);

            renderHook(() =>
                useReadingSessionLifecycle({
                    ...defaultProps,
                    activeSession: session,
                    book,
                    bookId: 42,
                    sessionPhase: READING_SESSION_PHASES.ACTIVE,
                })
            );

            const event = new Event('beforeunload', { cancelable: true });
            Object.defineProperty(event, 'returnValue', { writable: true, value: '' });
            window.dispatchEvent(event);
            expect(event.defaultPrevented).toBe(true);
        });

        it('popstate handler shows exit warning toast', () => {
            const session = makeSession(42);
            const book = makeBook(42);

            renderHook(() =>
                useReadingSessionLifecycle({
                    ...defaultProps,
                    activeSession: session,
                    book,
                    bookId: 42,
                    sessionPhase: READING_SESSION_PHASES.ACTIVE,
                    toast: mockToast,
                    t: mockT,
                })
            );

            // Clear any prior toast calls from effects
            mockToast.mockClear();
            mockT.mockClear();

            const popEvent = new PopStateEvent('popstate');
            window.dispatchEvent(popEvent);

            expect(mockT).toHaveBeenCalledWith('readingSession.alerts.exitWarning');
            expect(mockToast).toHaveBeenCalledTimes(1);
        });

        it('removes listeners on cleanup', () => {
            const removeSpy = vi.spyOn(window, 'removeEventListener');
            const session = makeSession(42);
            const book = makeBook(42);

            const { unmount } = renderHook(() =>
                useReadingSessionLifecycle({
                    ...defaultProps,
                    activeSession: session,
                    book,
                    bookId: 42,
                    sessionPhase: READING_SESSION_PHASES.ACTIVE,
                })
            );

            unmount();

            expect(removeSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
            expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function));
            removeSpy.mockRestore();
        });
    });
});
