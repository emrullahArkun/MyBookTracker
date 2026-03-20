import { useState, useEffect, useRef } from 'react';

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
};

export const useSessionTimer = (activeSession) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerIntervalRef = useRef(null);

    useEffect(() => {
        if (!activeSession) {
            setElapsedSeconds(0);
            return;
        }

        const tick = () => {
            const start = new Date(activeSession.startTime).getTime();
            const now = new Date().getTime();

            if (isNaN(start)) {
                setElapsedSeconds(0);
                return;
            }

            const pausedMillis = activeSession.pausedMillis || 0;

            if (activeSession.status === 'PAUSED' && activeSession.pausedAt) {
                const pAt = new Date(activeSession.pausedAt).getTime();
                const diff = Math.floor((pAt - start - pausedMillis) / 1000);
                setElapsedSeconds(Math.max(0, diff));
            } else {
                const diff = Math.floor((now - start - pausedMillis) / 1000);
                setElapsedSeconds(Math.max(0, diff));
            }
        };

        tick();

        if (activeSession.status === 'ACTIVE') {
            timerIntervalRef.current = setInterval(tick, 1000);
        }

        return () => clearInterval(timerIntervalRef.current);
    }, [activeSession]);

    return {
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
    };
};
