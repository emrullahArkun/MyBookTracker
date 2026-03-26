import { useState, useEffect, useRef } from 'react';
import type { ReadingSession } from '../../../shared/types/sessions';

const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
};

export const useSessionTimer = (activeSession: ReadingSession | null) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const timerIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!activeSession) {
            setElapsedSeconds(0);
            return;
        }

        const tick = () => {
            const start = new Date(activeSession.startTime).getTime();
            const now = new Date().getTime();

            if (Number.isNaN(start)) {
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
            timerIntervalRef.current = window.setInterval(tick, 1000);
        }

        return () => {
            if (timerIntervalRef.current !== null) {
                window.clearInterval(timerIntervalRef.current);
            }
        };
    }, [activeSession]);

    return {
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
    };
};
