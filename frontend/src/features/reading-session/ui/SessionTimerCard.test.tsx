import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SessionTimerCard from './SessionTimerCard';
import type { ReadingSessionPhase } from '../../../shared/types/sessions';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => {
            if (opts) return `${key}:${JSON.stringify(opts)}`;
            return key;
        },
    }),
}));

vi.mock('framer-motion', () => ({
    motion: (C: React.ComponentType<Record<string, unknown>> | string) => {
        const Wrapped = (props: Record<string, unknown>) => {
            const { initial, animate, transition, whileHover, whileTap, exit, ...rest } = props;
            void initial; void animate; void transition; void whileHover; void whileTap; void exit;
            if (typeof C === 'string') return <C {...rest} />;
            return <C {...rest} />;
        };
        Wrapped.displayName = `Motion(${typeof C === 'string' ? C : C.displayName || C.name})`;
        return Wrapped;
    },
}));

vi.mock('./SessionControls', () => ({
    default: () => <div data-testid="session-controls" />,
}));

vi.mock('./SessionRemoteAlert', () => ({
    default: () => <div data-testid="session-remote-alert" />,
}));

vi.mock('./SessionStatusDisplay', () => ({
    default: () => <div data-testid="session-status-display" />,
}));

vi.mock('./SessionStopConfirm', () => ({
    default: () => <div data-testid="session-stop-confirm" />,
}));

const baseProps = {
    cardBg: '#111',
    brandColor: '#c59a5c',
    sessionPhase: 'ACTIVE' as ReadingSessionPhase,
    isBusy: false,
    isPaused: false,
    formattedTime: '00:12:34',
    isController: true,
    takeControl: vi.fn(),
    showStopConfirm: false,
    endPage: '',
    setEndPage: vi.fn(),
    bookTitle: 'Test Book',
    authorName: 'Author',
    currentPageNumber: 100,
    pageCount: 300,
    currentPage: '100',
    subTextColor: '#ccc',
    mutedTextColor: '#aaa',
    borderColor: '#333',
    panelInsetBg: '#222',
    focusModeEnabled: false,
    onToggleFocusMode: vi.fn(),
    ambientMode: 'quiet' as const,
    onAmbientModeChange: vi.fn(),
    handleConfirmStop: vi.fn(),
    handleStopCancel: vi.fn(),
    resumeSession: vi.fn(),
    pauseSession: vi.fn(),
    handleStopClick: vi.fn(),
};

describe('SessionTimerCard', () => {
    it('renders the book title and author', () => {
        render(<SessionTimerCard {...baseProps} />);
        expect(screen.getByText('Test Book')).toBeInTheDocument();
        expect(screen.getByText('Author')).toBeInTheDocument();
    });

    it('renders progress percentage when pageCount is set', () => {
        render(<SessionTimerCard {...baseProps} />);
        expect(screen.getAllByText('33%').length).toBeGreaterThanOrEqual(1);
    });

    it('renders "—" when pageCount is null', () => {
        render(<SessionTimerCard {...baseProps} pageCount={null} />);
        expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(1);
    });

    it('renders SessionControls when showStopConfirm is false', () => {
        render(<SessionTimerCard {...baseProps} showStopConfirm={false} />);
        expect(screen.getByTestId('session-controls')).toBeInTheDocument();
        expect(screen.queryByTestId('session-stop-confirm')).not.toBeInTheDocument();
    });

    it('renders SessionStopConfirm when showStopConfirm is true', () => {
        render(<SessionTimerCard {...baseProps} showStopConfirm={true} />);
        expect(screen.getByTestId('session-stop-confirm')).toBeInTheDocument();
        expect(screen.queryByTestId('session-controls')).not.toBeInTheDocument();
    });

    it('renders SessionRemoteAlert when isController is false', () => {
        render(<SessionTimerCard {...baseProps} isController={false} />);
        expect(screen.getByTestId('session-remote-alert')).toBeInTheDocument();
    });

    it('does not render SessionRemoteAlert when isController is true', () => {
        render(<SessionTimerCard {...baseProps} isController={true} />);
        expect(screen.queryByTestId('session-remote-alert')).not.toBeInTheDocument();
    });

    it('shows "enter focus" button when focusModeEnabled is false', () => {
        render(<SessionTimerCard {...baseProps} focusModeEnabled={false} />);
        expect(screen.getByText('readingSession.controls.enterFocus')).toBeInTheDocument();
    });

    it('shows "show context" button when focusModeEnabled is true', () => {
        render(<SessionTimerCard {...baseProps} focusModeEnabled={true} />);
        expect(screen.getByText('readingSession.controls.showContext')).toBeInTheDocument();
    });

    it('renders ambient mode buttons', () => {
        render(<SessionTimerCard {...baseProps} />);
        expect(screen.getByText('readingSession.ambientModes.quiet')).toBeInTheDocument();
        expect(screen.getByText('readingSession.ambientModes.warm')).toBeInTheDocument();
        expect(screen.getByText('readingSession.ambientModes.night')).toBeInTheDocument();
    });

    it('shows paused ambient copy when isPaused', () => {
        render(<SessionTimerCard {...baseProps} isPaused={true} showStopConfirm={false} />);
        expect(screen.getByText('readingSession.ambience.paused')).toBeInTheDocument();
    });

    it('shows warm ambient copy', () => {
        render(<SessionTimerCard {...baseProps} ambientMode="warm" showStopConfirm={false} />);
        expect(screen.getByText(/readingSession\.ambience\.warm/)).toBeInTheDocument();
    });

    it('shows night ambient copy', () => {
        render(<SessionTimerCard {...baseProps} ambientMode="night" showStopConfirm={false} />);
        expect(screen.getByText(/readingSession\.ambience\.night/)).toBeInTheDocument();
    });

    it('shows quiet ambient copy by default', () => {
        render(<SessionTimerCard {...baseProps} ambientMode="quiet" showStopConfirm={false} />);
        expect(screen.getByText(/readingSession\.ambience\.quiet/)).toBeInTheDocument();
    });

    it('renders focus mode hint when focusModeEnabled is true', () => {
        render(<SessionTimerCard {...baseProps} focusModeEnabled={true} />);
        expect(screen.getByText('readingSession.focusModeHint')).toBeInTheDocument();
    });

    it('renders cozy line when focusModeEnabled is false', () => {
        render(<SessionTimerCard {...baseProps} focusModeEnabled={false} />);
        expect(screen.getByText(/readingSession\.cozyLine/)).toBeInTheDocument();
    });

    it('computes pagesLeft correctly', () => {
        render(<SessionTimerCard {...baseProps} currentPageNumber={100} pageCount={300} />);
        expect(screen.getByText('200')).toBeInTheDocument();
    });
});
