import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentProps } from 'react';
import SessionControls from './SessionControls';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Minimal Chakra mock — preserves disabled state and onClick on native button elements.
vi.mock('@chakra-ui/react', () => ({
    Button: ({ children, onClick, isDisabled, isLoading, leftIcon: _leftIcon, ...rest }: {
        children: React.ReactNode;
        onClick?: () => void;
        isDisabled?: boolean;
        isLoading?: boolean;
        leftIcon?: React.ReactNode;
        [key: string]: unknown;
    }) => (
        <button
            type="button"
            onClick={onClick}
            disabled={isDisabled || isLoading}
            {...Object.fromEntries(
                Object.entries(rest).filter(([k]) =>
                    !['size', 'w', 'h', 'fontSize', 'fontWeight', 'borderRadius', 'bg', 'color',
                      'boxShadow', '_hover', 'transition', 'columns', 'spacing'].includes(k)
                )
            )}
        >
            {children}
        </button>
    ),
    SimpleGrid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// react-icons don't need to render real SVGs in tests
vi.mock('react-icons/fa', () => ({
    FaPause: () => null,
    FaPlay: () => null,
    FaStop: () => null,
}));

type Props = ComponentProps<typeof SessionControls>;

const defaultProps: Props = {
    isPaused: false,
    resumeSession: vi.fn(),
    pauseSession: vi.fn(),
    handleStopClick: vi.fn(),
    isController: true,
    isBusy: false,
};

describe('SessionControls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('when isPaused=false', () => {
        it('renders the Pause button and Stop button', () => {
            render(<SessionControls {...defaultProps} isPaused={false} />);

            expect(screen.getByText('readingSession.controls.pause')).toBeInTheDocument();
            expect(screen.getByText('readingSession.controls.stop')).toBeInTheDocument();
            expect(screen.queryByText('readingSession.controls.resume')).not.toBeInTheDocument();
        });

        it('calls pauseSession when Pause is clicked', async () => {
            const pauseSession = vi.fn();
            render(<SessionControls {...defaultProps} isPaused={false} pauseSession={pauseSession} />);

            await userEvent.click(screen.getByText('readingSession.controls.pause'));

            expect(pauseSession).toHaveBeenCalledTimes(1);
        });
    });

    describe('when isPaused=true', () => {
        it('renders the Resume button and Stop button', () => {
            render(<SessionControls {...defaultProps} isPaused />);

            expect(screen.getByText('readingSession.controls.resume')).toBeInTheDocument();
            expect(screen.getByText('readingSession.controls.stop')).toBeInTheDocument();
            expect(screen.queryByText('readingSession.controls.pause')).not.toBeInTheDocument();
        });

        it('calls resumeSession when Resume is clicked', async () => {
            const resumeSession = vi.fn();
            render(<SessionControls {...defaultProps} isPaused resumeSession={resumeSession} />);

            await userEvent.click(screen.getByText('readingSession.controls.resume'));

            expect(resumeSession).toHaveBeenCalledTimes(1);
        });
    });

    it('calls handleStopClick when Stop is clicked', async () => {
        const handleStopClick = vi.fn();
        render(<SessionControls {...defaultProps} handleStopClick={handleStopClick} />);

        await userEvent.click(screen.getByText('readingSession.controls.stop'));

        expect(handleStopClick).toHaveBeenCalledTimes(1);
    });

    describe('disabled state', () => {
        it('disables all buttons when isController=false', () => {
            render(<SessionControls {...defaultProps} isController={false} />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(2);
            buttons.forEach((btn) => expect(btn).toBeDisabled());
        });

        it('disables all buttons when isBusy=true', () => {
            render(<SessionControls {...defaultProps} isBusy />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(2);
            buttons.forEach((btn) => expect(btn).toBeDisabled());
        });

        it('enables all buttons when isController=true and isBusy=false', () => {
            render(<SessionControls {...defaultProps} isController isBusy={false} />);

            const buttons = screen.getAllByRole('button');
            expect(buttons).toHaveLength(2);
            buttons.forEach((btn) => expect(btn).not.toBeDisabled());
        });
    });
});
