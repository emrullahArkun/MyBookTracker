import { useState, useEffect, useCallback, useRef } from 'react';

const LOCK_KEY = 'reading_session_controller_lock';
const LOCK_TTL_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 2000;
const CHECK_INTERVAL_MS = 3000;

type LockData = {
    controllerId: string;
    expiresAt: number;
};

type UseControllerLockResult = {
    isController: boolean;
    controllerId: string | null;
    tabId: string;
    takeControl: () => void;
};

const generateTabId = (): string => {
    return `tab_${Math.random().toString(36).substring(2, 11)}`;
};

export const useControllerLock = (): UseControllerLockResult => {
    const [isController, setIsController] = useState(false);
    const [tabId] = useState(generateTabId());
    const [controllerId, setControllerId] = useState<string | null>(null);

    const isControllerRef = useRef(false);
    const heartbeatRef = useRef<number | null>(null);
    const checkRef = useRef<number | null>(null);

    useEffect(() => {
        isControllerRef.current = isController;
    }, [isController]);

    const acquireLock = useCallback(() => {
        const now = Date.now();
        const lockData: LockData = {
            controllerId: tabId,
            expiresAt: now + LOCK_TTL_MS,
        };
        localStorage.setItem(LOCK_KEY, JSON.stringify(lockData));
        setIsController(true);
        setControllerId(tabId);
    }, [tabId]);

    const checkLock = useCallback(() => {
        const raw = localStorage.getItem(LOCK_KEY);
        const now = Date.now();

        if (!raw) {
            setControllerId(null);
            if (isControllerRef.current) {
                acquireLock();
            } else {
                setIsController(false);
            }
            return;
        }

        try {
            const lock = JSON.parse(raw) as LockData;
            if (lock.expiresAt > now) {
                setControllerId(lock.controllerId);
                const amIController = lock.controllerId === tabId;
                setIsController(amIController);
            } else {
                setControllerId(null);
                if (lock.controllerId === tabId) {
                    acquireLock();
                } else {
                    setIsController(false);
                }
            }
        } catch {
            setControllerId(null);
            setIsController(false);
        }
    }, [tabId, acquireLock]);

    useEffect(() => {
        if (isController) {
            acquireLock();
            heartbeatRef.current = window.setInterval(acquireLock, HEARTBEAT_INTERVAL_MS);
        } else if (heartbeatRef.current !== null) {
            window.clearInterval(heartbeatRef.current);
        }

        return () => {
            if (heartbeatRef.current !== null) {
                window.clearInterval(heartbeatRef.current);
            }
        };
    }, [isController, acquireLock]);

    useEffect(() => {
        checkLock();
        checkRef.current = window.setInterval(checkLock, CHECK_INTERVAL_MS);

        const handleStorage = (e: StorageEvent) => {
            if (e.key === LOCK_KEY) {
                checkLock();
            }
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            if (checkRef.current !== null) {
                window.clearInterval(checkRef.current);
            }
            window.removeEventListener('storage', handleStorage);
        };
    }, [checkLock]);

    return {
        isController,
        controllerId,
        tabId,
        takeControl: acquireLock,
    };
};
