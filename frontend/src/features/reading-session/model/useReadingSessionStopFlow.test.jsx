import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReadingSessionStopFlow } from './useReadingSessionStopFlow';

const createHook = (overrides = {}) => renderHook(() => useReadingSessionStopFlow({
    book: { currentPage: 12, pageCount: 200 },
    isPaused: false,
    pauseSession: vi.fn(),
    resumeSession: vi.fn(),
    stopSession: vi.fn(),
    toast: vi.fn(),
    onStopSuccess: vi.fn(),
    t: (key, values) => values?.total ? `${key}:${values.total}` : key,
    setHasStopped: vi.fn(),
    ...overrides,
}));

describe('useReadingSessionStopFlow', () => {
    it('resumes only when the stop dialog paused the session itself', () => {
        const pauseSession = vi.fn();
        const resumeSession = vi.fn();
        const { result } = createHook({ pauseSession, resumeSession, isPaused: false });

        act(() => {
            result.current.handleStopClick();
        });
        act(() => {
            result.current.handleStopCancel();
        });

        expect(pauseSession).toHaveBeenCalledTimes(1);
        expect(resumeSession).toHaveBeenCalledTimes(1);
    });

    it('does not resume an already paused session when stop is canceled', () => {
        const pauseSession = vi.fn();
        const resumeSession = vi.fn();
        const { result } = createHook({ pauseSession, resumeSession, isPaused: true });

        act(() => {
            result.current.handleStopClick();
        });
        act(() => {
            result.current.handleStopCancel();
        });

        expect(pauseSession).not.toHaveBeenCalled();
        expect(resumeSession).not.toHaveBeenCalled();
    });

    it('ignores stop clicks while another session action is busy', () => {
        const pauseSession = vi.fn();
        const { result } = createHook({ pauseSession, isBusy: true });

        act(() => {
            result.current.handleStopClick();
        });

        expect(pauseSession).not.toHaveBeenCalled();
        expect(result.current.showStopConfirm).toBe(false);
    });

    it('ignores invalid end pages when confirming stop', async () => {
        const stopSession = vi.fn();
        const setHasStopped = vi.fn();
        const { result } = createHook({
            stopSession,
            setHasStopped,
            book: { currentPage: null, pageCount: 200 },
        });

        act(() => {
            result.current.setEndPage('-1');
        });

        await waitFor(() => {
            expect(result.current.endPage).toBe('-1');
        });

        await act(async () => {
            await result.current.handleConfirmStop();
        });

        expect(stopSession).not.toHaveBeenCalled();
        expect(setHasStopped).not.toHaveBeenCalled();
    });

    it('shows a warning when the end page exceeds the book page count', async () => {
        const toast = vi.fn();
        const stopSession = vi.fn();
        const { result } = createHook({
            toast,
            stopSession,
            book: { currentPage: null, pageCount: 200 },
        });

        act(() => {
            result.current.setEndPage('250');
        });

        await waitFor(() => {
            expect(result.current.endPage).toBe('250');
        });

        await act(async () => {
            await result.current.handleConfirmStop();
        });

        expect(stopSession).not.toHaveBeenCalled();
        expect(toast).toHaveBeenCalledTimes(1);
        render(toast.mock.calls[0][0].render());
        expect(screen.getByText('readingSession.alerts.pageExceeds:200')).toBeInTheDocument();
    });

    it('does nothing when confirm stop runs without a loaded book', async () => {
        const stopSession = vi.fn();
        const setHasStopped = vi.fn();
        const { result } = createHook({
            book: null,
            stopSession,
            setHasStopped,
        });

        await act(async () => {
            await result.current.handleConfirmStop();
        });

        expect(stopSession).not.toHaveBeenCalled();
        expect(setHasStopped).not.toHaveBeenCalled();
    });

    it('stops the session and reports the completion summary on success', async () => {
        const stopSession = vi.fn().mockResolvedValue(true);
        const onStopSuccess = vi.fn();
        const setHasStopped = vi.fn();
        const { result } = createHook({
            stopSession,
            onStopSuccess,
            setHasStopped,
            book: { currentPage: 12, pageCount: 200 },
        });

        act(() => {
            result.current.setEndPage('42');
        });

        await act(async () => {
            await result.current.handleConfirmStop();
        });

        expect(setHasStopped).toHaveBeenCalledWith(true);
        expect(stopSession).toHaveBeenCalledTimes(1);
        expect(stopSession.mock.calls[0][1]).toBe(42);
        expect(onStopSuccess).toHaveBeenCalledWith({
            startPage: 12,
            endPage: 42,
            pagesRead: 30,
        });
    });

    it('clamps negative page deltas to zero in the completion summary', async () => {
        const stopSession = vi.fn().mockResolvedValue(true);
        const onStopSuccess = vi.fn();
        const { result } = createHook({
            stopSession,
            onStopSuccess,
            book: { currentPage: 50, pageCount: 200 },
        });

        act(() => {
            result.current.setEndPage('40');
        });

        await act(async () => {
            await result.current.handleConfirmStop();
        });

        expect(onStopSuccess).toHaveBeenCalledWith({
            startPage: 50,
            endPage: 40,
            pagesRead: 0,
        });
    });

    it('restores state and resumes when stop fails after pausing for the dialog', async () => {
        const pauseSession = vi.fn();
        const resumeSession = vi.fn();
        const stopSession = vi.fn().mockResolvedValue(false);
        const toast = vi.fn();
        const setHasStopped = vi.fn();
        const { result } = createHook({
            pauseSession,
            resumeSession,
            stopSession,
            toast,
            setHasStopped,
            isPaused: false,
        });

        act(() => {
            result.current.handleStopClick();
        });

        await act(async () => {
            await result.current.handleConfirmStop();
        });

        expect(setHasStopped).toHaveBeenNthCalledWith(1, true);
        expect(setHasStopped).toHaveBeenNthCalledWith(2, false);
        expect(resumeSession).toHaveBeenCalledTimes(1);
        expect(result.current.showStopConfirm).toBe(false);
        expect(toast).toHaveBeenCalledTimes(1);
        render(toast.mock.calls[0][0].render());
        expect(screen.getByText('readingSession.alerts.stopError')).toBeInTheDocument();
    });

    it('does not resume on failed stop when the session was already paused', async () => {
        const resumeSession = vi.fn();
        const stopSession = vi.fn().mockResolvedValue(false);
        const { result } = createHook({
            resumeSession,
            stopSession,
            isPaused: true,
        });

        act(() => {
            result.current.handleStopClick();
        });

        await act(async () => {
            await result.current.handleConfirmStop();
        });

        expect(resumeSession).not.toHaveBeenCalled();
    });

    it('syncs the end page when the book changes', () => {
        const baseProps = {
            isPaused: false,
            pauseSession: vi.fn(),
            resumeSession: vi.fn(),
            stopSession: vi.fn(),
            navigate: vi.fn(),
            toast: vi.fn(),
            t: (key, values) => values?.total ? `${key}:${values.total}` : key,
            setHasStopped: vi.fn(),
        };
        const { result, rerender } = renderHook(
            ({ book }) => useReadingSessionStopFlow({ ...baseProps, book }),
            { initialProps: { book: { currentPage: 12, pageCount: 200 } } }
        );

        expect(result.current.endPage).toBe('12');

        rerender({ book: { currentPage: 88, pageCount: 300 } });

        expect(result.current.endPage).toBe('88');
    });
});
