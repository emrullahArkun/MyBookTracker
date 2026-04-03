import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookStatsSidebar from './BookStatsSidebar';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

vi.mock('framer-motion', () => ({
    motion: (C: React.ComponentType<Record<string, unknown>> | string) => {
        const Wrapped = (props: Record<string, unknown>) => {
            const { initial, animate, transition, ...rest } = props;
            void initial; void animate; void transition;
            if (typeof C === 'string') return <C {...rest} />;
            return <C {...rest} />;
        };
        Wrapped.displayName = 'Motion';
        return Wrapped;
    },
}));

vi.mock('../../../shared/ui/BookCover', () => ({
    default: () => <div data-testid="book-cover" />,
}));

vi.mock('react-icons/fa', () => ({
    FaCheck: () => <span data-testid="check-icon" />,
}));

const baseBook = {
    id: 1,
    title: 'Test Book',
    authorName: 'Test Author',
    pageCount: 300,
    currentPage: 150,
    completed: false,
    coverUrl: null,
};

const baseStats = {
    progressPercent: 50,
    pagesRead: 150,
    totalPages: 300,
};

const baseProps = {
    book: baseBook,
    stats: baseStats,
    goalProgress: null,
    onOpenModal: vi.fn(),
    textColor: '#fff',
    subTextColor: '#ccc',
};

describe('BookStatsSidebar', () => {
    it('renders book title and author', () => {
        render(<BookStatsSidebar {...baseProps} />);
        expect(screen.getByText('Test Book')).toBeInTheDocument();
        expect(screen.getByText('Test Author')).toBeInTheDocument();
    });

    it('renders BookCover', () => {
        render(<BookStatsSidebar {...baseProps} />);
        expect(screen.getByTestId('book-cover')).toBeInTheDocument();
    });

    it('renders "set goal" button when no goalProgress', () => {
        render(<BookStatsSidebar {...baseProps} goalProgress={null} />);
        expect(screen.getByText('bookStats.goal.set')).toBeInTheDocument();
    });

    it('renders "edit goal" button when goalProgress exists', () => {
        render(
            <BookStatsSidebar
                {...baseProps}
                goalProgress={{
                    type: 'WEEKLY',
                    current: 10,
                    target: 30,
                    percent: 33,
                    isGoalReached: false,
                    multiplier: 0,
                }}
            />
        );
        expect(screen.getByText('bookStats.goal.edit')).toBeInTheDocument();
    });

    it('renders no-goal text when goalProgress is null', () => {
        render(<BookStatsSidebar {...baseProps} goalProgress={null} />);
        expect(screen.getByText('bookStats.goal.noGoal')).toBeInTheDocument();
    });

    it('renders goal progress when goalProgress exists', () => {
        render(
            <BookStatsSidebar
                {...baseProps}
                goalProgress={{
                    type: 'WEEKLY',
                    current: 10,
                    target: 30,
                    percent: 33,
                    isGoalReached: false,
                    multiplier: 0,
                }}
            />
        );
        expect(screen.getByText('bookStats.goal.modal.weekly')).toBeInTheDocument();
        expect(screen.getByText(/10/)).toBeInTheDocument();
    });

    it('renders goal reached badge when isGoalReached is true', () => {
        render(
            <BookStatsSidebar
                {...baseProps}
                goalProgress={{
                    type: 'MONTHLY',
                    current: 120,
                    target: 100,
                    percent: 120,
                    isGoalReached: true,
                    multiplier: 1,
                }}
            />
        );
        expect(screen.getByText('bookStats.goal.monthlyInfo')).toBeInTheDocument();
    });

    it('shows multiplier when >= 2', () => {
        render(
            <BookStatsSidebar
                {...baseProps}
                goalProgress={{
                    type: 'WEEKLY',
                    current: 90,
                    target: 30,
                    percent: 300,
                    isGoalReached: true,
                    multiplier: 3,
                }}
            />
        );
        expect(screen.getByText(/3x/)).toBeInTheDocument();
    });

    it('renders read progress section when stats is provided', () => {
        render(<BookStatsSidebar {...baseProps} />);
        expect(screen.getByText('bookStats.readProgress')).toBeInTheDocument();
        expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('does not render read progress when stats is null', () => {
        render(<BookStatsSidebar {...baseProps} stats={null} />);
        expect(screen.queryByText('bookStats.readProgress')).not.toBeInTheDocument();
    });

    it('renders completed badge for completed books', () => {
        render(<BookStatsSidebar {...baseProps} book={{ ...baseBook, completed: true }} />);
        expect(screen.getByText('bookStats.completed')).toBeInTheDocument();
    });

    it('does not render completed badge for non-completed books', () => {
        render(<BookStatsSidebar {...baseProps} />);
        expect(screen.queryByText('bookStats.completed')).not.toBeInTheDocument();
    });

    it('calls onOpenModal when goal button is clicked', () => {
        const onOpenModal = vi.fn();
        render(<BookStatsSidebar {...baseProps} onOpenModal={onOpenModal} />);
        fireEvent.click(screen.getByText('bookStats.goal.set'));
        expect(onOpenModal).toHaveBeenCalledOnce();
    });
});
