import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthLayout } from './AuthLayout';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('../../../shared/ui/Card', () => ({
    Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="card" className={className}>{children}</div>
    ),
}));

vi.mock('../../../app/navigation/LanguageSwitcher', () => ({
    default: () => <div data-testid="language-switcher" />,
}));

vi.mock('react-icons/md', () => ({
    MdAutoStories: () => <span data-testid="icon-stories" />,
    MdTimelapse: () => <span data-testid="icon-time" />,
    MdInsights: () => <span data-testid="icon-insights" />,
}));

describe('AuthLayout', () => {
    it('renders children and title', () => {
        render(
            <AuthLayout title="Log In">
                <div data-testid="form">form</div>
            </AuthLayout>
        );
        expect(screen.getByText('Log In')).toBeInTheDocument();
        expect(screen.getByTestId('form')).toBeInTheDocument();
    });

    it('renders the brand tagline', () => {
        render(<AuthLayout title="Login">child</AuthLayout>);
        expect(screen.getByText('auth.brand.tagline')).toBeInTheDocument();
    });

    it('renders feature list items', () => {
        render(<AuthLayout title="Login">child</AuthLayout>);
        expect(screen.getByText('auth.brand.features.track')).toBeInTheDocument();
        expect(screen.getByText('auth.brand.features.time')).toBeInTheDocument();
        expect(screen.getByText('auth.brand.features.visualize')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
        render(
            <AuthLayout title="Login" icon={<span data-testid="custom-icon" />}>
                child
            </AuthLayout>
        );
        expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('does not render icon span when icon is not provided', () => {
        const { container } = render(<AuthLayout title="Login">child</AuthLayout>);
        expect(container.querySelector('.auth-layout__mobile-icon')).toBeNull();
    });

    it('renders language switcher', () => {
        render(<AuthLayout title="Login">child</AuthLayout>);
        expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    });
});
