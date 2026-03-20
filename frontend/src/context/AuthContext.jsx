import { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { authApi } from '../features/auth/api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const isAuthenticated = !!user;

    const login = useCallback((userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(async () => {
        setUser(null);
        localStorage.removeItem('user');
        try {
            await authApi.logout();
        } catch {
            // Cookie will expire anyway
        }
    }, []);

    useEffect(() => {
        const handleUnauthorized = () => {
            setUser(null);
            localStorage.removeItem('user');
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);

        const initAuth = async () => {
            const storedUser = localStorage.getItem('user');

            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);

                    const res = await authApi.getSession();
                    if (!res) {
                        throw new Error("Session invalid");
                    }
                } catch {
                    localStorage.removeItem('user');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        initAuth();

        return () => {
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    const value = useMemo(() => ({
        user,
        isAuthenticated,
        login,
        logout,
        loading,
        // Keep token as alias for isAuthenticated for backward compatibility with useQuery enabled checks
        token: isAuthenticated,
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
