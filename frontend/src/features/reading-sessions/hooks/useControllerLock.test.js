import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useControllerLock } from './useControllerLock';

const LOCK_KEY = 'reading_session_controller_lock';

describe('useControllerLock', () => {
    let setItemSpy;

    beforeEach(() => {
        vi.useFakeTimers();
        localStorage.clear();
        setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
        vi.restoreAllMocks();
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

        const lock = JSON.parse(localStorage.getItem(LOCK_KEY));
        expect(lock.controllerId).toBe(result.current.tabId);
    });

    it('should maintain lock via heartbeat', () => {
        const { result } = renderHook(() => useControllerLock());

        act(() => {
            result.current.takeControl();
        });

        const callsAfterTakeControl = setItemSpy.mock.calls.filter(c => c[0] === LOCK_KEY).length;

        act(() => {
            // Heartbeat is 2000ms
            vi.advanceTimersByTime(2100);
        });

        const callsAfterHeartbeat = setItemSpy.mock.calls.filter(c => c[0] === LOCK_KEY).length;
        expect(callsAfterHeartbeat).toBeGreaterThan(callsAfterTakeControl);
    });

    it('should detect existing valid lock from another tab', () => {
        // Mock an existing valid lock
        localStorage.setItem(LOCK_KEY, JSON.stringify({
            controllerId: 'other_tab',
            expiresAt: Date.now() + 5000
        }));

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
        localStorage.setItem(LOCK_KEY, JSON.stringify({
            controllerId: 'other_tab',
            expiresAt: Date.now() - 1000 // Expired
        }));

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
        localStorage.setItem(LOCK_KEY, JSON.stringify({
            controllerId: result.current.tabId,
            expiresAt: Date.now() - 1000 // Expired
        }));

        act(() => {
            vi.advanceTimersByTime(1100);
        });

        // The auto-renew logic inside checkLock should kick in
        expect(result.current.isController).toBe(true);
    });

    it('should handle corrupt localStorage data', () => {
        localStorage.setItem(LOCK_KEY, 'not-json');

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
        localStorage.removeItem(LOCK_KEY);

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
        const newLockValue = JSON.stringify({
            controllerId: 'other_tab',
            expiresAt: Date.now() + 5000
        });
        localStorage.setItem(LOCK_KEY, newLockValue);

        act(() => {
            window.dispatchEvent(new StorageEvent('storage', {
                key: LOCK_KEY,
                newValue: newLockValue
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
