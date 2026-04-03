import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import type { ComponentProps } from 'react';
import SessionStatusDisplay from './SessionStatusDisplay';
import { READING_SESSION_PHASES } from '../model/readingSessionMachine';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// Minimal Chakra mock — layout and text components as plain HTML.
vi.mock('@chakra-ui/react', () => ({
    Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    HStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Icon: ({ as: IconComponent }: { as?: React.ComponentType }) => (
        IconComponent ? <span data-testid="icon"><IconComponent /></span> : null
    ),
    Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
    VStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-icons/fa', () => ({
    FaBookOpen: () => null,
}));

type Props = ComponentProps<typeof SessionStatusDisplay>;

const baseProps: Props = {
    brandColor: '#c59a5c',
    formattedTime: '01:23:45',
    isPaused: false,
    isBusy: false,
    sessionPhase: READING_SESSION_PHASES.ACTIVE,
};

describe('SessionStatusDisplay', () => {
    it('renders the formatted time', () => {
        render(<SessionStatusDisplay {...baseProps} />);

        expect(screen.getByText('01:23:45')).toBeInTheDocument();
    });

    it('renders the active session label', () => {
        render(<SessionStatusDisplay {...baseProps} />);

        expect(screen.getByText('readingSession.activeSession')).toBeInTheDocument();
    });

    describe('status label', () => {
        it('shows the paused label when isPaused=true', () => {
            render(<SessionStatusDisplay {...baseProps} isPaused />);

            expect(screen.getByText('readingSession.paused')).toBeInTheDocument();
        });

        it('shows the stop label when isBusy and phase is STOPPING', () => {
            render(
                <SessionStatusDisplay
                    {...baseProps}
                    isBusy
                    sessionPhase={READING_SESSION_PHASES.STOPPING}
                />
            );

            expect(screen.getByText('readingSession.controls.stop')).toBeInTheDocument();
        });

        it('shows the pause label when isBusy and phase is PAUSING', () => {
            render(
                <SessionStatusDisplay
                    {...baseProps}
                    isBusy
                    sessionPhase={READING_SESSION_PHASES.PAUSING}
                />
            );

            expect(screen.getByText('readingSession.controls.pause')).toBeInTheDocument();
        });

        it('shows the resume label when isBusy and phase is RESUMING', () => {
            render(
                <SessionStatusDisplay
                    {...baseProps}
                    isBusy
                    sessionPhase={READING_SESSION_PHASES.RESUMING}
                />
            );

            expect(screen.getByText('readingSession.controls.resume')).toBeInTheDocument();
        });

        it('shows the reading prompt when not paused and not busy', () => {
            render(<SessionStatusDisplay {...baseProps} isPaused={false} isBusy={false} />);

            expect(screen.getByText('readingSession.readingPrompt')).toBeInTheDocument();
        });

        it('shows the reading prompt when isBusy but phase is ACTIVE (not a transition phase)', () => {
            render(
                <SessionStatusDisplay
                    {...baseProps}
                    isPaused={false}
                    isBusy
                    sessionPhase={READING_SESSION_PHASES.ACTIVE}
                />
            );

            expect(screen.getByText('readingSession.readingPrompt')).toBeInTheDocument();
        });

        it('isPaused takes priority over isBusy transition phases', () => {
            render(
                <SessionStatusDisplay
                    {...baseProps}
                    isPaused
                    isBusy
                    sessionPhase={READING_SESSION_PHASES.STOPPING}
                />
            );

            expect(screen.getByText('readingSession.paused')).toBeInTheDocument();
            expect(screen.queryByText('readingSession.controls.stop')).not.toBeInTheDocument();
        });
    });
});
