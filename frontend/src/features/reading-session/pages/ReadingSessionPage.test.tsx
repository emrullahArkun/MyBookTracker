import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReadingSessionPage from './ReadingSessionPage';

// ── Hook mock ────────────────────────────────────────────────────────────────
const mockUseReadingSessionPageLogic = vi.fn();

vi.mock('../model/useReadingSessionPageLogic', () => ({
    useReadingSessionPageLogic: (...args: unknown[]) =>
        mockUseReadingSessionPageLogic(...args),
}));

// ── Router ───────────────────────────────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
    useParams: () => ({ id: '42' }),
    useNavigate: () => mockNavigate,
}));

// ── i18n ─────────────────────────────────────────────────────────────────────
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

// ── Theme ─────────────────────────────────────────────────────────────────────
vi.mock('../../../shared/theme/useThemeTokens', () => ({
    useThemeTokens: () => ({
        bgColor: '#000',
        cardBg: '#111',
        textColor: '#fff',
        subTextColor: '#ccc',
        mutedTextColor: '#aaa',
        brandColor: '#c59a5c',
        borderColor: '#333',
        panelInsetBg: '#222',
    }),
}));

// ── Child components ──────────────────────────────────────────────────────────
vi.mock('../ui/SessionTimerCard', () => ({
    default: () => <div data-testid="session-timer-card" />,
}));

vi.mock('../ui/SessionCompletionOverlay', () => ({
    default: ({ summary }: { summary: unknown }) => (
        <div data-testid="session-completion-overlay" data-summary={JSON.stringify(summary)} />
    ),
}));

// ── Chakra UI ─────────────────────────────────────────────────────────────────
vi.mock('@chakra-ui/react', () => ({
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Box: ({ children, ...rest }: { children?: React.ReactNode; [key: string]: unknown }) => (
        <div {...Object.fromEntries(
            Object.entries(rest).filter(([k]) =>
                !['textAlign', 'py', 'px', 'minH', 'overflow', 'display', 'flexDirection',
                  'position', 'top', 'right', 'bottom', 'left', 'w', 'h', 'borderRadius',
                  'bg', 'filter', 'pointerEvents', 'color', 'zIndex'].includes(k)
            )
        )}>{children}</div>
    ),
    Flex: ({ children, justify: _justify, align: _align, ...rest }: {
        children?: React.ReactNode;
        justify?: string;
        align?: string;
        [key: string]: unknown;
    }) => <div {...Object.fromEntries(
        Object.entries(rest).filter(([k]) =>
            !['direction', 'gap', 'mb', 'h'].includes(k)
        )
    )}>{children}</div>,
    Button: ({ children, onClick, leftIcon: _leftIcon, ...rest }: {
        children: React.ReactNode;
        onClick?: () => void;
        leftIcon?: React.ReactNode;
        [key: string]: unknown;
    }) => (
        <button
            type="button"
            onClick={onClick}
            {...Object.fromEntries(
                Object.entries(rest).filter(([k]) =>
                    !['variant', 'color', 'borderRadius', 'px', 'alignSelf', '_hover',
                      'fontSize', 'fontWeight', 'letterSpacing', 'textTransform',
                      'border', 'borderColor', 'bg'].includes(k)
                )
            )}
        >
            {children}
        </button>
    ),
    Container: ({ children, ...rest }: { children: React.ReactNode; [key: string]: unknown }) => (
        <div {...Object.fromEntries(
            Object.entries(rest).filter(([k]) =>
                !['maxW', 'flex', 'minH', 'display', 'flexDirection', 'position', 'zIndex'].includes(k)
            )
        )}>{children}</div>
    ),
    Spinner: ({ ...rest }: { [key: string]: unknown }) => (
        <div
            role="status"
            data-testid="spinner"
            {...Object.fromEntries(
                Object.entries(rest).filter(([k]) =>
                    !['size', 'color', 'thickness'].includes(k)
                )
            )}
        />
    ),
}));

vi.mock('react-icons/fa', () => ({
    FaArrowLeft: () => null,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

const mockBook = {
    id: 42,
    title: 'Test Book',
    authorName: 'Author',
    currentPage: 100,
    pageCount: 300,
};

const baseLogicResult = {
    book: mockBook,
    fetchingBook: false,
    activeSession: { id: 1 },
    sessionLoading: false,
    sessionPhase: 'ACTIVE',
    isBusy: false,
    formattedTime: '00:12:34',
    isPaused: false,
    resumeSession: vi.fn(),
    pauseSession: vi.fn(),
    isController: true,
    takeControl: vi.fn(),
    showStopConfirm: false,
    endPage: '',
    setEndPage: vi.fn(),
    handleStopClick: vi.fn(),
    handleStopCancel: vi.fn(),
    handleConfirmStop: vi.fn(),
    completionSummary: null,
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReadingSessionPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockReset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('loading state', () => {
        it('renders a spinner when fetchingBook is true', () => {
            mockUseReadingSessionPageLogic.mockReturnValue({
                ...baseLogicResult,
                fetchingBook: true,
                sessionLoading: false,
            });

            render(<ReadingSessionPage />);

            expect(screen.getByTestId('spinner')).toBeInTheDocument();
            expect(screen.queryByTestId('session-timer-card')).not.toBeInTheDocument();
        });

        it('renders a spinner when sessionLoading is true', () => {
            mockUseReadingSessionPageLogic.mockReturnValue({
                ...baseLogicResult,
                fetchingBook: false,
                sessionLoading: true,
            });

            render(<ReadingSessionPage />);

            expect(screen.getByTestId('spinner')).toBeInTheDocument();
            expect(screen.queryByTestId('session-timer-card')).not.toBeInTheDocument();
        });

        it('renders a spinner when both fetchingBook and sessionLoading are true', () => {
            mockUseReadingSessionPageLogic.mockReturnValue({
                ...baseLogicResult,
                fetchingBook: true,
                sessionLoading: true,
            });

            render(<ReadingSessionPage />);

            expect(screen.getByTestId('spinner')).toBeInTheDocument();
        });
    });

    describe('no book found', () => {
        it('renders the not-found message when book is null', () => {
            mockUseReadingSessionPageLogic.mockReturnValue({
                ...baseLogicResult,
                fetchingBook: false,
                sessionLoading: false,
                book: null,
            });

            render(<ReadingSessionPage />);

            expect(screen.getByText('bookStats.notFound')).toBeInTheDocument();
            expect(screen.queryByTestId('session-timer-card')).not.toBeInTheDocument();
        });

        it('does not render the spinner when book is null and loading is done', () => {
            mockUseReadingSessionPageLogic.mockReturnValue({
                ...baseLogicResult,
                fetchingBook: false,
                sessionLoading: false,
                book: null,
            });

            render(<ReadingSessionPage />);

            expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
        });
    });

    describe('active session', () => {
        it('renders SessionTimerCard when book and activeSession exist', () => {
            mockUseReadingSessionPageLogic.mockReturnValue(baseLogicResult);

            render(<ReadingSessionPage />);

            expect(screen.getByTestId('session-timer-card')).toBeInTheDocument();
        });

        it('does not render the completion overlay when completionSummary is null', () => {
            mockUseReadingSessionPageLogic.mockReturnValue({
                ...baseLogicResult,
                completionSummary: null,
            });

            render(<ReadingSessionPage />);

            expect(screen.queryByTestId('session-completion-overlay')).not.toBeInTheDocument();
        });

        it('renders the back-to-library button', () => {
            mockUseReadingSessionPageLogic.mockReturnValue(baseLogicResult);

            render(<ReadingSessionPage />);

            expect(screen.getByRole('button', { name: 'navbar.myBooks' })).toBeInTheDocument();
        });

        it('renders the focus mode badge', () => {
            mockUseReadingSessionPageLogic.mockReturnValue(baseLogicResult);

            render(<ReadingSessionPage />);

            expect(screen.getByText('readingSession.focusBadge')).toBeInTheDocument();
        });

        it('calls navigate to MY_BOOKS when back button is clicked', () => {
            mockUseReadingSessionPageLogic.mockReturnValue(baseLogicResult);

            render(<ReadingSessionPage />);

            screen.getByRole('button', { name: 'navbar.myBooks' }).click();

            expect(mockNavigate).toHaveBeenCalledWith('/my-books');
        });

        it('passes the book id param to useReadingSessionPageLogic', () => {
            mockUseReadingSessionPageLogic.mockReturnValue(baseLogicResult);

            render(<ReadingSessionPage />);

            expect(mockUseReadingSessionPageLogic).toHaveBeenCalledWith('42');
        });
    });

    describe('completion summary', () => {
        const summary = { pagesRead: 20, duration: 1234 };

        it('renders the completion overlay when completionSummary is set', () => {
            mockUseReadingSessionPageLogic.mockReturnValue({
                ...baseLogicResult,
                completionSummary: summary,
            });

            render(<ReadingSessionPage />);

            expect(screen.getByTestId('session-completion-overlay')).toBeInTheDocument();
        });

        it('auto-navigates to MY_BOOKS after 3500 ms', () => {
            mockUseReadingSessionPageLogic.mockReturnValue({
                ...baseLogicResult,
                completionSummary: summary,
            });

            render(<ReadingSessionPage />);

            expect(mockNavigate).not.toHaveBeenCalled();

            vi.advanceTimersByTime(3500);

            expect(mockNavigate).toHaveBeenCalledWith('/my-books');
        });

        it('does not navigate before 3500 ms have passed', () => {
            mockUseReadingSessionPageLogic.mockReturnValue({
                ...baseLogicResult,
                completionSummary: summary,
            });

            render(<ReadingSessionPage />);

            vi.advanceTimersByTime(3499);

            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });
});
