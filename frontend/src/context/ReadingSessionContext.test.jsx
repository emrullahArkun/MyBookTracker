import { render, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReadingSessionProvider, useReadingSessionContext } from './ReadingSessionContext';

// Mock dependencies
vi.mock('./AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../features/reading-sessions/api/sessionsApi', () => ({
    sessionsApi: {
        getActive: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
    },
}));

vi.mock('../shared/hooks/useControllerLock', () => ({
    useControllerLock: vi.fn(),
}));

import { useAuth } from './AuthContext';
import { sessionsApi } from '../features/reading-sessions/api/sessionsApi';
import { useControllerLock } from '../shared/hooks/useControllerLock';

// Helper
const TestConsumer = ({ onRender }) => {
    const ctx = useReadingSessionContext();
    onRender(ctx);
    return null;
};

// Mock BroadcastChannel
class MockBroadcastChannel {
    constructor() { this.onmessage = null; }
    postMessage() { }
    close() { }
}

describe('ReadingSessionContext', () => {
    let mockTakeControl;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.spyOn(console, 'error').mockImplementation(() => { });

        global.BroadcastChannel = MockBroadcastChannel;

        useAuth.mockReturnValue({ token: 'test-token' });
        mockTakeControl = vi.fn();
        useControllerLock.mockReturnValue({
            isController: true,
            takeControl: mockTakeControl,
        });
        sessionsApi.getActive.mockResolvedValue(null);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should fetch active session on mount', async () => {
        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        expect(sessionsApi.getActive).toHaveBeenCalled();
        expect(captured.activeSession).toBeNull();
        expect(captured.loading).toBe(false);
    });

    it('should set activeSession to null when no token', async () => {
        useAuth.mockReturnValue({ token: null });

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        expect(captured.activeSession).toBeNull();
        expect(captured.loading).toBe(false);
        expect(sessionsApi.getActive).not.toHaveBeenCalled();
    });

    it('should set activeSession when API returns active session', async () => {
        const session = {
            id: 1,
            startTime: new Date().toISOString(),
            status: 'ACTIVE',
            pausedMillis: 0,
        };
        sessionsApi.getActive.mockResolvedValue(session);

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        expect(captured.activeSession).toEqual(session);
    });

    // --- startSession ---

    it('startSession should set session and take control', async () => {
        const newSession = { id: 2, startTime: new Date().toISOString(), status: 'ACTIVE' };
        sessionsApi.start.mockResolvedValue(newSession);

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        let result;
        await act(async () => {
            result = await captured.startSession(10);
        });

        expect(result).toBe(true);
        expect(sessionsApi.start).toHaveBeenCalledWith(10);
        expect(mockTakeControl).toHaveBeenCalled();
    });

    it('startSession should return false on error', async () => {
        sessionsApi.start.mockRejectedValue(new Error('fail'));

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        let result;
        await act(async () => {
            result = await captured.startSession(10);
        });

        expect(result).toBe(false);
    });

    // --- stopSession ---

    it('stopSession should clear session', async () => {
        sessionsApi.getActive.mockResolvedValue({ id: 1, startTime: new Date().toISOString(), status: 'ACTIVE' });
        sessionsApi.stop.mockResolvedValue({});

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        let result;
        await act(async () => {
            result = await captured.stopSession(new Date(), 100);
        });

        expect(result).toBe(true);
        expect(captured.activeSession).toBeNull();
    });

    it('stopSession should return false on error', async () => {
        sessionsApi.stop.mockRejectedValue(new Error('fail'));

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        let result;
        await act(async () => {
            result = await captured.stopSession(new Date(), 100);
        });

        expect(result).toBe(false);
    });

    // --- pauseSession ---

    it('pauseSession should update session', async () => {
        const pausedSession = { id: 1, status: 'PAUSED', startTime: new Date().toISOString(), pausedAt: new Date().toISOString() };
        sessionsApi.pause.mockResolvedValue(pausedSession);

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        await act(async () => {
            await captured.pauseSession();
        });

        expect(captured.activeSession).toEqual(pausedSession);
        expect(captured.isPaused).toBe(true);
    });

    it('pauseSession should do nothing when not controller', async () => {
        useControllerLock.mockReturnValue({ isController: false, takeControl: mockTakeControl });

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        await act(async () => {
            await captured.pauseSession();
        });

        expect(sessionsApi.pause).not.toHaveBeenCalled();
    });

    it('pauseSession should handle API error gracefully', async () => {
        sessionsApi.pause.mockRejectedValue(new Error('fail'));

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        await act(async () => {
            await captured.pauseSession();
        });

        // Should not throw — error handled silently
        expect(captured.activeSession).toBeNull();
    });

    // --- resumeSession ---

    it('resumeSession should update session', async () => {
        const activeSession = { id: 1, status: 'ACTIVE', startTime: new Date().toISOString() };
        sessionsApi.resume.mockResolvedValue(activeSession);

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        await act(async () => {
            await captured.resumeSession();
        });

        expect(captured.activeSession).toEqual(activeSession);
    });

    it('resumeSession should do nothing when not controller', async () => {
        useControllerLock.mockReturnValue({ isController: false, takeControl: mockTakeControl });

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        await act(async () => {
            await captured.resumeSession();
        });

        expect(sessionsApi.resume).not.toHaveBeenCalled();
    });

    it('resumeSession should handle API error gracefully', async () => {
        sessionsApi.resume.mockRejectedValue(new Error('fail'));

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        await act(async () => {
            await captured.resumeSession();
        });

        // Should not throw — error handled silently
        expect(captured.activeSession).toBeNull();
    });

    // --- formatTime ---

    it('formatTime should format without hours', async () => {
        sessionsApi.getActive.mockResolvedValue({
            id: 1,
            startTime: new Date(Date.now() - 125000).toISOString(), // ~2m 5s ago
            status: 'ACTIVE',
            pausedMillis: 0,
        });

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        // formattedTime should be "Xm Ys" format (no hours)
        expect(captured.formattedTime).toMatch(/^\d+m \d+s$/);
    });

    it('formatTime should include hours when >= 3600s', async () => {
        sessionsApi.getActive.mockResolvedValue({
            id: 1,
            startTime: new Date(Date.now() - 3700000).toISOString(), // ~1h 1m 40s ago
            status: 'ACTIVE',
            pausedMillis: 0,
        });

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        expect(captured.formattedTime).toMatch(/^\d+h \d+m \d+s$/);
    });

    // --- Timer: PAUSED state ---

    it('should show static time when PAUSED', async () => {
        const now = Date.now();
        sessionsApi.getActive.mockResolvedValue({
            id: 1,
            startTime: new Date(now - 60000).toISOString(), // 60s ago
            status: 'PAUSED',
            pausedAt: new Date(now - 30000).toISOString(), // Paused 30s ago
            pausedMillis: 0,
        });

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        // pausedAt - startTime - pausedMillis = 30000ms = 30s
        expect(captured.elapsedSeconds).toBe(30);
        expect(captured.isPaused).toBe(true);
    });

    // --- Timer: no session ---

    it('should reset elapsed to 0 when no session', async () => {
        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        expect(captured.elapsedSeconds).toBe(0);
    });

    // --- useReadingSessionContext outside provider ---

    it('should throw when used outside provider', () => {
        // Suppress expected console.error from React when throwing during render
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        const Bad = () => { useReadingSessionContext(); return null; };
        expect(() => render(<Bad />)).toThrow(
            'useReadingSessionContext must be used within a ReadingSessionProvider'
        );
        consoleSpy.mockRestore();
    });

    // --- refreshSession error handling ---

    it('should handle refreshSession errors gracefully', async () => {
        sessionsApi.getActive.mockRejectedValue(new Error('Network error'));

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        expect(captured.activeSession).toBeNull();
    });

    // --- BroadcastChannel REFRESH_SESSION ---

    it('should refresh session when BroadcastChannel receives REFRESH_SESSION', async () => {
        vi.useRealTimers(); // waitFor needs real timers
        let bcInstance;
        global.BroadcastChannel = class {
            constructor() { bcInstance = this; this.onmessage = null; }
            postMessage() { }
            close() { }
        };

        sessionsApi.getActive.mockResolvedValue(null);

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        // Simulate receiving a message
        const newSession = { id: 99, startTime: new Date().toISOString(), status: 'ACTIVE' };
        sessionsApi.getActive.mockResolvedValue(newSession);

        await act(async () => {
            bcInstance.onmessage({ data: 'REFRESH_SESSION' });
        });

        await waitFor(() => {
            expect(captured.activeSession).toEqual(newSession);
        });
    });

    // --- Storage event filtering ---

    it('should ignore storage events for reading_session_controller_lock key', async () => {
        sessionsApi.getActive.mockResolvedValue(null);

        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={() => { }} />
                </ReadingSessionProvider>
            );
        });

        const callCountBefore = sessionsApi.getActive.mock.calls.length;

        act(() => {
            window.dispatchEvent(new StorageEvent('storage', { key: 'reading_session_controller_lock' }));
        });

        // Should NOT have triggered another getActive call
        expect(sessionsApi.getActive.mock.calls.length).toBe(callCountBefore);
    });

    it('should refresh on storage events for other keys', async () => {
        sessionsApi.getActive.mockResolvedValue(null);

        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={() => { }} />
                </ReadingSessionProvider>
            );
        });

        const callCountBefore = sessionsApi.getActive.mock.calls.length;

        await act(async () => {
            window.dispatchEvent(new StorageEvent('storage', { key: 'some_other_key' }));
        });

        expect(sessionsApi.getActive.mock.calls.length).toBeGreaterThan(callCountBefore);
    });

    // --- Timer: tick advancement ---

    it('should advance elapsedSeconds as time passes', async () => {
        const now = Date.now();
        sessionsApi.getActive.mockResolvedValue({
            id: 1,
            startTime: new Date(now).toISOString(),
            status: 'ACTIVE',
            pausedMillis: 0,
        });

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        const initialSeconds = captured.elapsedSeconds;

        act(() => {
            vi.advanceTimersByTime(5000);
        });

        expect(captured.elapsedSeconds).toBe(initialSeconds + 5);
    });

    // --- Timer: invalid startTime ---

    it('should set elapsedSeconds to 0 when startTime is invalid (NaN)', async () => {
        sessionsApi.getActive.mockResolvedValue({
            id: 1,
            startTime: 'not-a-date',
            status: 'ACTIVE',
            pausedMillis: 0,
        });

        let captured;
        await act(async () => {
            render(
                <ReadingSessionProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </ReadingSessionProvider>
            );
        });

        expect(captured.elapsedSeconds).toBe(0);
    });
});
