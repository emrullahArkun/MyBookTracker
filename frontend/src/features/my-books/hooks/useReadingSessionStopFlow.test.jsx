import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useReadingSessionStopFlow } from './useReadingSessionStopFlow';

const createHook = (overrides = {}) => renderHook(() => useReadingSessionStopFlow({
    book: { currentPage: 12, pageCount: 200 },
    isPaused: false,
    pauseSession: vi.fn(),
    resumeSession: vi.fn(),
    stopSession: vi.fn(),
    navigate: vi.fn(),
    toast: vi.fn(),
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
});
