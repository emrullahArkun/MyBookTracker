import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useControllerLock } from './useControllerLock';

describe('useControllerLock', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        global.localStorage = {
            store: {},
            getItem: vi.fn(function (key) { return this.store[key] || null; }),
            setItem: vi.fn(function (key, value) { this.store[key] = value; }),
            clear: vi.fn(function () { this.store = {}; })
        };
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('should initialize optimally', () => {
        const { result } = renderHook(() => useControllerLock());
        expect(result.current.isController).toBe(false);
        expect(result.current.controllerId).toBeNull();
        expect(result.current.tabId).toContain('tab_');
    });

    it('should acquire lock and become controller', () => {
        const { result } = renderHook(() => useControllerLock());

        act(() => {
            result.current.takeControl();
        });

        expect(result.current.isController).toBe(true);
        expect(result.current.controllerId).toBe(result.current.tabId);

        const lock = JSON.parse(global.localStorage.setItem.mock.calls[0][1]);
        expect(lock.controllerId).toBe(result.current.tabId);
    });

    it('should maintain lock via heartbeat', () => {
        const { result } = renderHook(() => useControllerLock());

        act(() => {
            result.current.takeControl();
        });

        // 1 manual + 1 from useEffect
        expect(global.localStorage.setItem).toHaveBeenCalledTimes(2);

        act(() => {
            // Heartbeat is 2000ms
            vi.advanceTimersByTime(2100);
        });

        // 2 + 1 heartbeat
        expect(global.localStorage.setItem).toHaveBeenCalledTimes(3);
    });

    it('should detect existing valid lock from another tab', () => {
        // Mock an existing valid lock
        global.localStorage.store['reading_session_controller_lock'] = JSON.stringify({
            controllerId: 'other_tab',
            expiresAt: Date.now() + 5000
        });

        const { result } = renderHook(() => useControllerLock());

        // Lock check happens on mount
        act(() => {
            vi.advanceTimersByTime(1100);
        });

        expect(result.current.isController).toBe(false);
        expect(result.current.controllerId).toBe('other_tab');
    });

    it('should handle expired lock from another tab', () => {
        // Mock an expired lock
        global.localStorage.store['reading_session_controller_lock'] = JSON.stringify({
            controllerId: 'other_tab',
            expiresAt: Date.now() - 1000 // Expired
        });

        const { result } = renderHook(() => useControllerLock());

        act(() => {
            vi.advanceTimersByTime(1100);
        });

        expect(result.current.isController).toBe(false);
        expect(result.current.controllerId).toBeNull();
    });

    it('should renew lock if it expired but we were the controller', () => {
        const { result } = renderHook(() => useControllerLock());

        act(() => {
            result.current.takeControl();
        });

        expect(result.current.isController).toBe(true);

        // Simulate lock expiring manually in storage without heartbeat updating it
        global.localStorage.store['reading_session_controller_lock'] = JSON.stringify({
            controllerId: result.current.tabId,
            expiresAt: Date.now() - 1000 // Expired
        });

        act(() => {
            // checkLock runs every 1000ms
            vi.advanceTimersByTime(1100);
        });

        // The auto-renew logic inside checkLock should kick in
        expect(result.current.isController).toBe(true);
        expect(global.localStorage.setItem).toHaveBeenCalled(); // It wrote a new lock
    });

    it('should handle corrupt localStorage data', () => {
        global.localStorage.store['reading_session_controller_lock'] = 'not-json';

        const { result } = renderHook(() => useControllerLock());

        act(() => {
            vi.advanceTimersByTime(1100);
        });

        expect(result.current.isController).toBe(false);
        expect(result.current.controllerId).toBeNull();
    });

    it('should re-acquire lock when storage is cleared while being controller', () => {
        const { result } = renderHook(() => useControllerLock());

        act(() => {
            result.current.takeControl();
        });

        expect(result.current.isController).toBe(true);

        // Clear localStorage to simulate lock being removed
        delete global.localStorage.store['reading_session_controller_lock'];

        act(() => {
            vi.advanceTimersByTime(3100);
        });

        // Should re-acquire since we were controller
        expect(result.current.isController).toBe(true);
    });

    it('should react to storage events from other tabs', () => {
        const { result } = renderHook(() => useControllerLock());

        act(() => {
            result.current.takeControl();
        });

        expect(result.current.isController).toBe(true);

        // Simulate another tab taking the lock via storage event
        global.localStorage.store['reading_session_controller_lock'] = JSON.stringify({
            controllerId: 'other_tab',
            expiresAt: Date.now() + 5000
        });

        act(() => {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'reading_session_controller_lock',
                newValue: global.localStorage.store['reading_session_controller_lock']
            }));
        });

        expect(result.current.isController).toBe(false);
        expect(result.current.controllerId).toBe('other_tab');
    });

    it('should ignore storage events for unrelated keys', () => {
        const { result } = renderHook(() => useControllerLock());

        act(() => {
            result.current.takeControl();
        });

        expect(result.current.isController).toBe(true);

        act(() => {
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'some_other_key',
                newValue: 'whatever'
            }));
        });

        // Should still be controller
        expect(result.current.isController).toBe(true);
    });
});
