import { useEffect, useRef, useCallback } from 'react';

export const useSessionBroadcast = (token, onRefresh) => {
    const broadcastChannelRef = useRef(null);

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
        window.addEventListener('storage', handleStorage);
        window.addEventListener('focus', onRefresh);

        return () => {
            if (broadcastChannelRef.current) broadcastChannelRef.current.close();
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener('focus', onRefresh);
        };
    }, [token, onRefresh]);

    const broadcastUpdate = useCallback(() => {
        if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage('REFRESH_SESSION');
        }
    }, []);

    return { broadcastUpdate };
};
