import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionBroadcast } from './useSessionBroadcast';

class MockBroadcastChannel {
    static instances = [];

    constructor(name) {
        this.name = name;
        this.close = vi.fn();
        this.postMessage = vi.fn();
        this.onmessage = null;
        MockBroadcastChannel.instances.push(this);
    }
}

describe('useSessionBroadcast', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        MockBroadcastChannel.instances = [];
        global.BroadcastChannel = MockBroadcastChannel;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete global.BroadcastChannel;
    });

    it('refreshes when the broadcast channel receives a refresh message', () => {
        const onRefresh = vi.fn();
        renderHook(() => useSessionBroadcast('token', onRefresh));

        act(() => {
            MockBroadcastChannel.instances[0].onmessage({ data: 'REFRESH_SESSION' });
        });

        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('ignores unrelated broadcast messages', () => {
        const onRefresh = vi.fn();
        renderHook(() => useSessionBroadcast('token', onRefresh));

        act(() => {
            MockBroadcastChannel.instances[0].onmessage({ data: 'OTHER' });
        });

        expect(onRefresh).not.toHaveBeenCalled();
    });

    it('refreshes on storage changes except for the controller lock key', () => {
        const onRefresh = vi.fn();
        renderHook(() => useSessionBroadcast('token', onRefresh));

        act(() => {
            window.dispatchEvent(new StorageEvent('storage', { key: 'books' }));
            window.dispatchEvent(new StorageEvent('storage', { key: 'reading_session_controller_lock' }));
        });

        expect(onRefresh).toHaveBeenCalledTimes(1);
    });

    it('throttles focus refreshes to one call per time window', () => {
        const onRefresh = vi.fn();
        renderHook(() => useSessionBroadcast('token', onRefresh));

        act(() => {
            window.dispatchEvent(new Event('focus'));
            window.dispatchEvent(new Event('focus'));
        });

        expect(onRefresh).toHaveBeenCalledTimes(1);

        act(() => {
            vi.advanceTimersByTime(10_001);
            window.dispatchEvent(new Event('focus'));
        });

        expect(onRefresh).toHaveBeenCalledTimes(2);
    });

    it('broadcasts refresh updates and closes the channel on unmount', () => {
        const onRefresh = vi.fn();
        const { result, unmount } = renderHook(() => useSessionBroadcast('token', onRefresh));
        const channel = MockBroadcastChannel.instances[0];

        act(() => {
            result.current.broadcastUpdate();
        });

        expect(channel.postMessage).toHaveBeenCalledWith('REFRESH_SESSION');

        unmount();

        expect(channel.close).toHaveBeenCalledTimes(1);
    });
});
