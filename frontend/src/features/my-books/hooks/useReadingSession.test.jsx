import { renderHook, act, waitFor } from '@testing-library/react';
import { useReadingSessionContext } from '../../../context/ReadingSessionContext';
import { ReadingSessionProvider } from '../../../context/ReadingSessionContext';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock AuthContext
vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ token: true })
}));

describe('useReadingSessionContext', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should fetch active session on mount and calculate elapsed time', async () => {
        const startTime = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hour ago

        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({
                id: 1,
                bookId: 101,
                startTime: startTime,
                status: 'ACTIVE'
            })
        });

        const wrapper = ({ children }) => (
            <ReadingSessionProvider>{children}</ReadingSessionProvider>
        );

        const { result } = renderHook(() => useReadingSessionContext(), { wrapper });

        // Wait for fetch to complete
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.activeSession).toBeTruthy();
        expect(result.current.activeSession.bookId).toBe(101);

        // Should be at least 3600 seconds (or close to it)
        expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(3599);
    });

    it('should handle no active session', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 204
        });

        const wrapper = ({ children }) => (
            <ReadingSessionProvider>{children}</ReadingSessionProvider>
        );

        const { result } = renderHook(() => useReadingSessionContext(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.activeSession).toBeNull();
        expect(result.current.elapsedSeconds).toBe(0);
    });

    it('should start a session', async () => {
        // Mock initial fetch as empty
        global.fetch.mockResolvedValueOnce({ ok: true, status: 204 });

        const wrapper = ({ children }) => (
            <ReadingSessionProvider>{children}</ReadingSessionProvider>
        );

        const { result } = renderHook(() => useReadingSessionContext(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        // Mock start response
        const newSession = {
            id: 2,
            bookId: 202,
            startTime: new Date().toISOString(),
            status: 'ACTIVE'
        };
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => newSession
        });

        let success;
        await act(async () => {
            success = await result.current.startSession(202);
        });

        expect(success).toBe(true);
        expect(result.current.activeSession).toEqual(newSession);
        expect(global.fetch).toHaveBeenCalledWith('/api/sessions/start', expect.objectContaining({
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({ bookId: 202 })
        }));
    });
});
