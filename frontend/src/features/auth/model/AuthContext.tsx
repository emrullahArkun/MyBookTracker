import { createContext, useState, useContext, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import type { AuthContextValue, StoredAuthUser } from '../../../shared/types/auth';

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'user';

const clearStoredUser = (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
};

const isStoredAuthUser = (value: unknown): value is StoredAuthUser => {
    return typeof value === 'object'
        && value !== null
        && 'email' in value
        && typeof value.email === 'string';
};

const readStoredUser = (): StoredAuthUser | null => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedUser) {
        return null;
    }

    try {
        const parsed = JSON.parse(storedUser) as unknown;
        if (isStoredAuthUser(parsed)) {
            return parsed;
        }

        clearStoredUser();
        return null;
    } catch {
        clearStoredUser();
        return null;
    }
};

type AuthProviderProps = {
    children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState<StoredAuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const isAuthenticated = !!user;

    const login = useCallback((userData: StoredAuthUser) => {
        queryClient.clear();
        setUser(userData);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
    }, [queryClient]);

    const logout = useCallback(async () => {
        queryClient.clear();
        setUser(null);
        clearStoredUser();
        try {
            await authApi.logout();
        } catch {
            // Cookie will expire anyway.
        }
    }, [queryClient]);

    useEffect(() => {
        const handleUnauthorized = () => {
            queryClient.clear();
            setUser(null);
            clearStoredUser();
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);

        const initAuth = async () => {
            const storedUser = readStoredUser();

            if (storedUser) {
                try {
                    const session = await authApi.getSession();
                    const sessionUser = session?.user;
                    if (!sessionUser) {
                        throw new Error('Session invalid');
                    }

                    setUser(sessionUser);
                    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
                } catch {
                    queryClient.clear();
                    clearStoredUser();
                    setUser(null);
                }
            }

            setLoading(false);
        };

        void initAuth();

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [queryClient]);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        isAuthenticated,
        login,
        logout,
        loading,
        email: user?.email ?? null,
    }), [user, isAuthenticated, login, logout, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
