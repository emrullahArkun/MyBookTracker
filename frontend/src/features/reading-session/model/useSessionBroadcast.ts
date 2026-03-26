import { useEffect, useRef, useCallback } from 'react';

const FOCUS_THROTTLE_MS = 10_000;
const REFRESH_SESSION_MESSAGE = 'REFRESH_SESSION';

type UseSessionBroadcastResult = {
    broadcastUpdate: () => void;
};

export const useSessionBroadcast = (
    token: string | null,
    onRefresh: () => void | Promise<void>
): UseSessionBroadcastResult => {
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
    const lastFocusRefreshRef = useRef(0);

    useEffect(() => {
        broadcastChannelRef.current = new BroadcastChannel('reading_session_sync');
        broadcastChannelRef.current.onmessage = (event: MessageEvent<string>) => {
            if (event.data === REFRESH_SESSION_MESSAGE) {
                void onRefresh();
            }
        };

        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'reading_session_controller_lock') return;
            void onRefresh();
        };

        const handleFocus = () => {
            const now = Date.now();
            if (now - lastFocusRefreshRef.current < FOCUS_THROTTLE_MS) return;
            lastFocusRefreshRef.current = now;
            void onRefresh();
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
            broadcastChannelRef.current.postMessage(REFRESH_SESSION_MESSAGE);
        }
    }, []);

    return { broadcastUpdate };
};
