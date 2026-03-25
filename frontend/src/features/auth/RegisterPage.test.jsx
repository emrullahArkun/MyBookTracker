import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RegisterPage from './RegisterPage';

const mockNavigate = vi.fn();
const mockToast = vi.fn();

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
    }),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('./api/authApi', () => ({
    authApi: { register: vi.fn() },
}));

vi.mock('@chakra-ui/react', async () => {
    const actual = await vi.importActual('@chakra-ui/react');
    return { ...actual, useToast: () => mockToast };
});

vi.mock('../../ui/layouts/AuthLayout', () => ({
    AuthLayout: ({ children }) => <div>{children}</div>,
}));

vi.mock('../../ui/TextField', () => ({
    TextField: ({ label, value, onChange, type, error }) => (
        <div>
            <label>{label}</label>
            <input type={type} value={value} onChange={onChange} aria-label={label} />
            {error && <span role="alert">{error}</span>}
        </div>
    ),
}));

vi.mock('../../ui/Button', () => ({
    Button: ({ children, ...props }) => {
        const buttonProps = { ...props };
        delete buttonProps.isLoading;
        return <button {...buttonProps}>{children}</button>;
    },
}));

import { authApi } from './api/authApi';

describe('RegisterPage', () => {
    beforeEach(() => vi.clearAllMocks());

    const fillForm = (email, password, confirm) => {
        fireEvent.change(screen.getByLabelText('auth.email'), { target: { value: email } });
        fireEvent.change(screen.getByLabelText('auth.password'), { target: { value: password } });
        fireEvent.change(screen.getByLabelText('auth.confirmPassword'), { target: { value: confirm } });
    };

    it('should render 3 input fields and submit button', () => {
        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        expect(screen.getByLabelText('auth.email')).toBeInTheDocument();
        expect(screen.getByLabelText('auth.password')).toBeInTheDocument();
        expect(screen.getByLabelText('auth.confirmPassword')).toBeInTheDocument();
        expect(screen.getByText('auth.register.button')).toBeInTheDocument();
    });

    it('should show error for empty email', async () => {
        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        fillForm('', 'pass', 'pass');
        fireEvent.click(screen.getByText('auth.register.button'));

        expect(screen.getByText('auth.required')).toBeInTheDocument();
    });

    it('should show error for invalid email', async () => {
        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        fillForm('invalid', 'pass', 'pass');
        fireEvent.click(screen.getByText('auth.register.button'));

        expect(screen.getByText('auth.invalidEmail')).toBeInTheDocument();
    });

    it('should show error for empty password', async () => {
        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        fillForm('a@b.com', '', 'pass');
        fireEvent.click(screen.getByText('auth.register.button'));

        expect(screen.getAllByText('auth.required').length).toBeGreaterThan(0);
    });

    it('should show error when passwords do not match', async () => {
        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        fillForm('a@b.com', 'pass1', 'pass2');
        fireEvent.click(screen.getByText('auth.register.button'));

        expect(screen.getByText('auth.passwordsDoNotMatch')).toBeInTheDocument();
    });

    it('should call register API and navigate on success', async () => {
        authApi.register.mockResolvedValue({});

        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        fillForm('a@b.com', 'pass', 'pass');
        fireEvent.click(screen.getByText('auth.register.button'));

        await waitFor(() => {
            expect(authApi.register).toHaveBeenCalledWith('a@b.com', 'pass');
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    it('should handle register API error', async () => {
        authApi.register.mockRejectedValue(new Error('Email taken'));

        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        fillForm('a@b.com', 'pass', 'pass');
        fireEvent.click(screen.getByText('auth.register.button'));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(
                expect.objectContaining({
                    description: 'Email taken',
                    status: 'error',
                })
            );
        });
    });

    it('should render login link', () => {
        render(<MemoryRouter><RegisterPage /></MemoryRouter>);
        expect(screen.getByText('auth.login.button')).toBeInTheDocument();
    });
});
