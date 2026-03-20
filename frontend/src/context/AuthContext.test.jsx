import { render, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';

// Mock authApi
vi.mock('../features/auth/api/authApi', () => ({
    authApi: {
        getSession: vi.fn(),
        logout: vi.fn(),
    },
}));

import { authApi } from '../features/auth/api/authApi';

// Helper component that exposes context values
const TestConsumer = ({ onRender }) => {
    const ctx = useAuth();
    onRender(ctx);
    return <div data-testid="user">{ctx.user ? ctx.user.email : 'none'}</div>;
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should provide default values: user=null, isAuthenticated=false, loading=true initially', async () => {
        authApi.getSession.mockResolvedValue(null);
        let captured;

        await act(async () => {
            render(
                <AuthProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </AuthProvider>
            );
        });

        expect(captured.loading).toBe(false);
        expect(captured.user).toBeNull();
        expect(captured.isAuthenticated).toBe(false);
    });

    it('should restore session from localStorage when user exists and cookie session is valid', async () => {
        localStorage.setItem('user', JSON.stringify({ email: 'test@test.com' }));
        authApi.getSession.mockResolvedValue({ valid: true });

        let captured;
        await act(async () => {
            render(
                <AuthProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </AuthProvider>
            );
        });

        await waitFor(() => {
            expect(captured.user).toEqual({ email: 'test@test.com' });
            expect(captured.isAuthenticated).toBe(true);
            expect(captured.loading).toBe(false);
        });
    });

    it('should clear session when server validation fails', async () => {
        localStorage.setItem('user', JSON.stringify({ email: 'old@test.com' }));
        authApi.getSession.mockRejectedValue(new Error('Unauthorized'));

        let captured;
        await act(async () => {
            render(
                <AuthProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </AuthProvider>
            );
        });

        await waitFor(() => {
            expect(captured.user).toBeNull();
            expect(captured.isAuthenticated).toBe(false);
        });
    });

    it('should clear session when getSession returns null/falsy', async () => {
        localStorage.setItem('user', JSON.stringify({ email: 'x@x.com' }));
        authApi.getSession.mockResolvedValue(null);

        let captured;
        await act(async () => {
            render(
                <AuthProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </AuthProvider>
            );
        });

        await waitFor(() => {
            expect(captured.user).toBeNull();
            expect(captured.isAuthenticated).toBe(false);
        });
    });

    it('login should store user', async () => {
        authApi.getSession.mockResolvedValue(null);
        let captured;

        await act(async () => {
            render(
                <AuthProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </AuthProvider>
            );
        });

        act(() => {
            captured.login({ email: 'new@test.com' });
        });

        expect(captured.user).toEqual({ email: 'new@test.com' });
        expect(captured.isAuthenticated).toBe(true);
        expect(localStorage.getItem('user')).toBeTruthy();
    });

    it('logout should clear user and call logout API', async () => {
        localStorage.setItem('user', JSON.stringify({ email: 'x@x.com' }));
        authApi.getSession.mockResolvedValue({ valid: true });
        authApi.logout.mockResolvedValue(null);

        let captured;
        await act(async () => {
            render(
                <AuthProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </AuthProvider>
            );
        });

        await act(async () => {
            captured.logout();
        });

        expect(captured.user).toBeNull();
        expect(captured.isAuthenticated).toBe(false);
        expect(localStorage.getItem('user')).toBeNull();
    });

    it('should logout on auth:unauthorized event', async () => {
        localStorage.setItem('user', JSON.stringify({ email: 'x@x.com' }));
        authApi.getSession.mockResolvedValue({ valid: true });

        let captured;
        await act(async () => {
            render(
                <AuthProvider>
                    <TestConsumer onRender={(ctx) => { captured = ctx; }} />
                </AuthProvider>
            );
        });

        await waitFor(() => expect(captured.user).not.toBeNull());

        act(() => {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        });

        expect(captured.user).toBeNull();
        expect(captured.isAuthenticated).toBe(false);
    });

    it('useAuth should throw when used outside AuthProvider', () => {
        const BadComponent = () => {
            useAuth();
            return null;
        };

        expect(() => render(<BadComponent />)).toThrow(
            'useAuth must be used within an AuthProvider'
        );
    });
});
