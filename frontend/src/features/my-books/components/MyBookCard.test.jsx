import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MyBookCard from './MyBookCard';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k) => k }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock UI Components
vi.mock('../../../ui/BookCover', () => ({
    default: ({ book }) => <div data-testid="book-cover">{book?.title}</div>
}));

describe('MyBookCard', () => {
    const defaultBook = {
        id: '1',
        title: 'Test Book',
        currentPage: 10,
        pageCount: 100,
        completed: false
    };

    let onUpdateProgress, onToggleSelect;

    beforeEach(() => {
        vi.clearAllMocks();
        onUpdateProgress = vi.fn();
        onToggleSelect = vi.fn();
    });

    const renderCard = (book = defaultBook, isSelected = false) => {
        return render(
            <MemoryRouter>
                <MyBookCard
                    book={book}
                    isSelected={isSelected}
                    onUpdateProgress={onUpdateProgress}
                    onToggleSelect={onToggleSelect}
                />
            </MemoryRouter>
        );
    };

    it('renders the book cover and progress', () => {
        renderCard();
        expect(screen.getByTestId('book-cover')).toBeInTheDocument();
        expect(screen.getAllByText('Test Book').length).toBeGreaterThanOrEqual(1);
        // Pages text (e.g. "10 / 100 bookStats.pages")
        expect(screen.getByText(/bookStats\.pages/)).toBeInTheDocument();
    });

    it('renders completed badge if completed', () => {
        renderCard({ ...defaultBook, completed: true });
        expect(screen.getByText('bookCard.finished')).toBeInTheDocument();
    });

    it('renders no page count if pageCount is 0', () => {
        renderCard({ ...defaultBook, pageCount: 0 });
        // When pageCount is 0, no page info is rendered
        expect(screen.queryByText('bookStats.pages')).toBeNull();
    });

    it('triggers onToggleSelect when checkbox is clicked', () => {
        renderCard();
        const checkbox = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
        expect(onToggleSelect).toHaveBeenCalledWith('1');
    });

    it('navigates to session on play button click', () => {
        renderCard();
        // Play button text is 'readingSession.start'
        const startBtn = screen.getByText('readingSession.start');
        fireEvent.click(startBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/books/1/session');
    });

    it('navigates to stats on chart button click', () => {
        renderCard();
        const statsBtn = screen.getByText('navbar.stats');
        fireEvent.click(statsBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/books/1/stats');
    });
});
