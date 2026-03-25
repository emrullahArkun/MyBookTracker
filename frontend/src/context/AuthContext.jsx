import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../features/auth/api/authApi';

export const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'user';

const clearStoredUser = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
};

const readStoredUser = () => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch {
        clearStoredUser();
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isAuthenticated = !!user;

    const login = useCallback((userData) => {
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
            // Cookie will expire anyway
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
                        throw new Error("Session invalid");
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
        initAuth();

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, [queryClient]);

    const value = useMemo(() => ({
        user,
        isAuthenticated,
        login,
        logout,
        loading,
        // Keep token as alias for older hooks, but make it user-bound for query keys.
        token: user?.email ?? null,
    }), [user, isAuthenticated, login, logout, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
