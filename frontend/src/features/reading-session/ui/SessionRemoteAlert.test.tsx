import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SessionRemoteAlert from './SessionRemoteAlert';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Minimal Chakra mock — Alert family + Button rendered as plain HTML.
vi.mock('@chakra-ui/react', () => ({
    Alert: ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
        <div role="alert" {...Object.fromEntries(
            Object.entries(rest).filter(([k]) =>
                !['status', 'borderRadius', 'variant', 'bg', 'border', 'borderColor'].includes(k)
            )
        )}>
            {children}
        </div>
    ),
    AlertIcon: () => <span data-testid="alert-icon" />,
    Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    Button: ({ children, onClick, ...rest }: {
        children: React.ReactNode;
        onClick?: () => void;
        [key: string]: unknown;
    }) => (
        <button
            type="button"
            onClick={onClick}
            {...Object.fromEntries(
                Object.entries(rest).filter(([k]) => !['size'].includes(k))
            )}
        >
            {children}
        </button>
    ),
}));

describe('SessionRemoteAlert', () => {
    let takeControl: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        takeControl = vi.fn();
    });

    it('renders the alert with title and description', () => {
        render(<SessionRemoteAlert takeControl={takeControl} />);

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('readingSession.remote.title')).toBeInTheDocument();
        expect(screen.getByText('readingSession.remote.desc')).toBeInTheDocument();
    });

    it('renders a "Take Control" button', () => {
        render(<SessionRemoteAlert takeControl={takeControl} />);

        expect(screen.getByRole('button', { name: 'readingSession.remote.takeControl' })).toBeInTheDocument();
    });

    it('calls takeControl when the button is clicked', async () => {
        render(<SessionRemoteAlert takeControl={takeControl} />);

        await userEvent.click(screen.getByRole('button', { name: 'readingSession.remote.takeControl' }));

        expect(takeControl).toHaveBeenCalledTimes(1);
    });

    it('renders the alert icon', () => {
        render(<SessionRemoteAlert takeControl={takeControl} />);

        expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });
});
