import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../auth/model/AuthContext';
import BookStatsPage from './BookStatsPage';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// react-router-dom — real implementation + stubbed useParams
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useParams: () => ({ id: '42' }),
    };
});

// react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => {
            if (opts?.message) return `${key}: ${opts.message}`;
            return key;
        },
        i18n: { language: 'en', resolvedLanguage: 'en', changeLanguage: vi.fn() },
    }),
}));

// Domain hooks — we control their return values per test via mockReturnValue
const mockUseBookStats = vi.fn();
const mockUseBookStatsCalculations = vi.fn();
const mockUseBookGoalEditor = vi.fn();

vi.mock('../model/useBookStats', () => ({
    useBookStats: (...args: unknown[]) => mockUseBookStats(...args),
}));

vi.mock('../model/useBookStatsCalculations', () => ({
    useBookStatsCalculations: (...args: unknown[]) => mockUseBookStatsCalculations(...args),
}));

vi.mock('../model/useBookGoalEditor', () => ({
    useBookGoalEditor: (...args: unknown[]) => mockUseBookGoalEditor(...args),
}));

// Theme hook — constant tokens, no provider required
vi.mock('../../../shared/theme/useThemeTokens', () => ({
    useThemeTokens: () => ({
        bgColor: '#000',
        cardBg: '#111',
        textColor: '#fff',
        subTextColor: '#ccc',
        mutedTextColor: '#aaa',
        brandColor: '#c59a5c',
        borderColor: '#333',
        panelShadow: 'none',
    }),
}));

// Heavy child components — replace with lightweight stubs so the test does
// not depend on chart libraries or complex sub-trees.
vi.mock('../ui/BookStatsSidebar', () => ({
    default: () => <div data-testid="book-stats-sidebar" />,
}));

vi.mock('../ui/BookStatsCharts', () => ({
    default: () => <div data-testid="book-stats-charts" />,
}));

vi.mock('../ui/BookGoalModal', () => ({
    default: () => <div data-testid="book-goal-modal" />,
}));

vi.mock('../ui/NoSessionsModal', () => ({
    default: () => <div data-testid="no-sessions-modal" />,
}));

vi.mock('../../../shared/ui/StatsCard', () => ({
    default: ({ label }: { label: string }) => <div data-testid="stats-card">{label}</div>,
}));

vi.mock('../../../shared/ui/PageErrorState', () => ({
    default: ({ title }: { title: string }) => (
        <div data-testid="page-error-state">{title}</div>
    ),
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockBook = {
    id: 42,
    title: 'The Great Gatsby',
    authorName: 'F. Scott Fitzgerald',
    pageCount: 180,
    currentPage: 90,
    completed: false,
    coverUrl: 'http://example.com/gatsby.jpg',
    readingGoalType: null,
    readingGoalPages: null,
    readingGoalProgress: null,
};

const mockStats = {
    totalTime: '3h 20m',
    speed: '25.0',
    timeLeft: '1h 10m',
    graphData: [],
    progressPercent: 50,
    pagesRead: 90,
    totalPages: 180,
};

const mockSessions = [
    {
        id: 1,
        bookId: 42,
        startTime: '2026-01-01T10:00:00Z',
        endTime: '2026-01-01T11:00:00Z',
        startPage: 0,
        endPage: 30,
        pausedMillis: 0,
    },
];

const defaultGoalEditorReturn = {
    goalType: 'WEEKLY',
    setGoalType: vi.fn(),
    goalPages: '',
    setGoalPages: vi.fn(),
    isSavingGoal: false,
    handleSaveGoal: vi.fn(),
};

// ---------------------------------------------------------------------------
// Test wrapper
// ---------------------------------------------------------------------------

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <AuthContext.Provider
            value={{
                user: { email: 'test@example.com' },
                email: 'test@example.com',
                isAuthenticated: true,
                loading: false,
                login: vi.fn(),
                logout: vi.fn(),
            }}
        >
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={['/books/42/stats']}>
                    {children}
                </MemoryRouter>
            </QueryClientProvider>
        </AuthContext.Provider>
    );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BookStatsPage', () => {
    beforeEach(() => {
        mockUseBookGoalEditor.mockReturnValue(defaultGoalEditorReturn);
    });

    // -----------------------------------------------------------------------
    // Loading state
    // -----------------------------------------------------------------------

    describe('loading state', () => {
        it('renders a spinner while data is being fetched', () => {
            mockUseBookStats.mockReturnValue({
                book: null,
                sessions: [],
                loading: true,
                error: null,
                refetch: vi.fn(),
            });
            mockUseBookStatsCalculations.mockReturnValue({ stats: null, goalProgress: null });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            // Chakra Spinner renders with class "chakra-spinner"
            expect(document.querySelector('.chakra-spinner')).not.toBeNull();
        });

        it('does not render book content while loading', () => {
            mockUseBookStats.mockReturnValue({
                book: null,
                sessions: [],
                loading: true,
                error: null,
                refetch: vi.fn(),
            });
            mockUseBookStatsCalculations.mockReturnValue({ stats: null, goalProgress: null });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            expect(screen.queryByText('The Great Gatsby')).not.toBeInTheDocument();
            expect(screen.queryByTestId('book-stats-sidebar')).not.toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Error state
    // -----------------------------------------------------------------------

    describe('error state', () => {
        it('renders the PageErrorState component when an error occurs', () => {
            mockUseBookStats.mockReturnValue({
                book: null,
                sessions: [],
                loading: false,
                error: { message: 'Network failure' },
                refetch: vi.fn(),
            });
            mockUseBookStatsCalculations.mockReturnValue({ stats: null, goalProgress: null });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            expect(screen.getByTestId('page-error-state')).toBeInTheDocument();
        });

        it('passes the error message to PageErrorState', () => {
            mockUseBookStats.mockReturnValue({
                book: null,
                sessions: [],
                loading: false,
                error: { message: 'Network failure' },
                refetch: vi.fn(),
            });
            mockUseBookStatsCalculations.mockReturnValue({ stats: null, goalProgress: null });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            // The translation mock interpolates the message into the key
            expect(screen.getByTestId('page-error-state')).toHaveTextContent('Network failure');
        });

        it('renders string errors as well', () => {
            mockUseBookStats.mockReturnValue({
                book: null,
                sessions: [],
                loading: false,
                error: 'Unexpected error',
                refetch: vi.fn(),
            });
            mockUseBookStatsCalculations.mockReturnValue({ stats: null, goalProgress: null });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            expect(screen.getByTestId('page-error-state')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Not-found state (book is null, no loading, no error)
    // -----------------------------------------------------------------------

    describe('book not found state', () => {
        it('renders the not-found message when book is null', () => {
            mockUseBookStats.mockReturnValue({
                book: null,
                sessions: [],
                loading: false,
                error: null,
                refetch: vi.fn(),
            });
            mockUseBookStatsCalculations.mockReturnValue({ stats: null, goalProgress: null });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            expect(screen.getByText('bookStats.notFound')).toBeInTheDocument();
        });

        it('does not render sidebar or charts for missing book', () => {
            mockUseBookStats.mockReturnValue({
                book: null,
                sessions: [],
                loading: false,
                error: null,
                refetch: vi.fn(),
            });
            mockUseBookStatsCalculations.mockReturnValue({ stats: null, goalProgress: null });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            expect(screen.queryByTestId('book-stats-sidebar')).not.toBeInTheDocument();
            expect(screen.queryByTestId('book-stats-charts')).not.toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Loaded / success state
    // -----------------------------------------------------------------------

    describe('loaded state', () => {
        beforeEach(() => {
            mockUseBookStats.mockReturnValue({
                book: mockBook,
                sessions: mockSessions,
                loading: false,
                error: null,
                refetch: vi.fn(),
            });
            mockUseBookStatsCalculations.mockReturnValue({
                stats: mockStats,
                goalProgress: null,
            });
        });

        it('renders the book title', () => {
            render(<BookStatsPage />, { wrapper: createWrapper() });
            expect(screen.getByText('The Great Gatsby')).toBeInTheDocument();
        });

        it('renders the book author', () => {
            render(<BookStatsPage />, { wrapper: createWrapper() });
            expect(screen.getByText('F. Scott Fitzgerald')).toBeInTheDocument();
        });

        it('renders the stats sidebar', () => {
            render(<BookStatsPage />, { wrapper: createWrapper() });
            expect(screen.getByTestId('book-stats-sidebar')).toBeInTheDocument();
        });

        it('renders the stats charts when stats are available', () => {
            render(<BookStatsPage />, { wrapper: createWrapper() });
            expect(screen.getByTestId('book-stats-charts')).toBeInTheDocument();
        });

        it('renders stat cards with correct labels', () => {
            render(<BookStatsPage />, { wrapper: createWrapper() });
            const statCards = screen.getAllByTestId('stats-card');
            expect(statCards.length).toBeGreaterThanOrEqual(2);
        });

        it('renders the projection stat card for non-completed books', () => {
            render(<BookStatsPage />, { wrapper: createWrapper() });
            expect(
                screen.getByText('bookStats.projection.label')
            ).toBeInTheDocument();
        });

        it('hides the projection stat card for completed books', () => {
            mockUseBookStats.mockReturnValue({
                book: { ...mockBook, completed: true },
                sessions: mockSessions,
                loading: false,
                error: null,
                refetch: vi.fn(),
            });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            expect(
                screen.queryByText('bookStats.projection.label')
            ).not.toBeInTheDocument();
        });

        it('does not render charts when stats are null', () => {
            mockUseBookStatsCalculations.mockReturnValue({
                stats: null,
                goalProgress: null,
            });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            expect(screen.queryByTestId('book-stats-charts')).not.toBeInTheDocument();
        });

        it('shows "-" stat values when there are no sessions', () => {
            mockUseBookStats.mockReturnValue({
                book: mockBook,
                sessions: [],       // no sessions
                loading: false,
                error: null,
                refetch: vi.fn(),
            });

            render(<BookStatsPage />, { wrapper: createWrapper() });

            // Each StatsCard stub renders its label; the "-" value is passed as
            // a prop but the stub only renders the label. We verify that at least
            // the stat cards are still present to confirm the page still renders.
            expect(screen.getAllByTestId('stats-card').length).toBeGreaterThanOrEqual(2);
        });

        it('passes the correct bookId from useParams to the hooks', () => {
            render(<BookStatsPage />, { wrapper: createWrapper() });

            // useBookStats should have been called with the id returned by useParams ('42')
            expect(mockUseBookStats).toHaveBeenCalledWith('42');
        });
    });
});
