import { useEffect, useRef, useCallback } from 'react';

const FOCUS_THROTTLE_MS = 10_000; // Max one refresh per 10 seconds on focus

export const useSessionBroadcast = (token, onRefresh) => {
    const broadcastChannelRef = useRef(null);
    const lastFocusRefreshRef = useRef(0);

    useEffect(() => {
        broadcastChannelRef.current = new BroadcastChannel('reading_session_sync');
        broadcastChannelRef.current.onmessage = (event) => {
            if (event.data === 'REFRESH_SESSION') {
                onRefresh();
            }
        };

        const handleStorage = (e) => {
            if (e.key === 'reading_session_controller_lock') return;
            onRefresh();
        };

        const handleFocus = () => {
            const now = Date.now();
            if (now - lastFocusRefreshRef.current < FOCUS_THROTTLE_MS) return;
            lastFocusRefreshRef.current = now;
            onRefresh();
        };

        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', handleFocus);

        return () => {
            if (broadcastChannelRef.current) broadcastChannelRef.current.close();
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', handleFocus);
        };
    }, [token, onRefresh]);

    const broadcastUpdate = useCallback(() => {
        if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage('REFRESH_SESSION');
        }
    }, []);

    return { broadcastUpdate };
};
