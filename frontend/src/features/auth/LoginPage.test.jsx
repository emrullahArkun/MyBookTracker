import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

// Mock dependencies
const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
    }),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ login: mockLogin }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useLocation: () => ({ state: null }),
    };
});

vi.mock('./api/authApi', () => ({
    authApi: { login: vi.fn() },
}));

vi.mock('@chakra-ui/react', async () => {
    const actual = await vi.importActual('@chakra-ui/react');
    return { ...actual, useToast: () => vi.fn() };
});

// Simple stub for custom UI components
vi.mock('../../ui/layouts/AuthLayout', () => ({
    AuthLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../ui/TextField', () => ({
    TextField: ({ label, value, onChange, type, placeholder }) => (
        <div>
            <label>{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                aria-label={label}
            />
        </div>
    ),
}));

vi.mock('../../ui/Button', () => ({
    Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

import { authApi } from './api/authApi';

describe('LoginPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render email and password fields', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
        expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
    });

    it('should render submit button', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        expect(screen.getByText('auth.login.button')).toBeInTheDocument();
    });

    it('should call authApi.login on form submit', async () => {
        authApi.login.mockResolvedValue({ user: { email: 'a@b.com', role: 'USER' } });

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'a@b.com' } });
        fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'pass' } });
        fireEvent.click(screen.getByText('auth.login.button'));

        await waitFor(() => {
            expect(authApi.login).toHaveBeenCalledWith('a@b.com', 'pass');
            expect(mockLogin).toHaveBeenCalledWith({ email: 'a@b.com', role: 'USER' });
            expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
        });
    });

    it('should show error message on login failure', async () => {
        authApi.login.mockRejectedValue(new Error('Invalid credentials'));

        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: 'a@b.com' } });
        fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByText('auth.login.button'));

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('should render register link', () => {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );

        expect(screen.getByText('auth.register.button')).toBeInTheDocument();
    });
});
