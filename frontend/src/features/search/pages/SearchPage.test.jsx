import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchPage from './SearchPage';

const mockUseBookSearch = vi.fn();

vi.mock('../model/useBookSearch', () => ({
    useBookSearch: () => mockUseBookSearch(),
}));

vi.mock('../../../shared/ui/TypewriterTitle', () => ({
    default: () => <div>TypewriterTitle</div>,
}));

vi.mock('../ui/SearchForm', () => ({
    default: ({ onSearch }) => <button onClick={onSearch}>SearchForm</button>,
}));

vi.mock('../ui/SearchResultSkeleton', () => ({
    default: () => <div>Skeleton</div>,
}));

vi.mock('../ui/SearchResultCard', () => ({
    default: ({ book, onAdd }) => (
        <button
            onClick={() => {
                onAdd(book)
                    .then(() => {
                        window.__searchAddResult = 'resolved';
                    })
                    .catch(() => {
                        window.__searchAddResult = 'rejected';
                    });
            }}
        >
            {book.title}
        </button>
    ),
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

describe('SearchPage', () => {
    const book = { title: 'Duplicate Book', isbn: '123' };

    beforeEach(() => {
        vi.clearAllMocks();
        window.__searchAddResult = undefined;
    });

    it('rethrows failed add attempts so success-only UI does not run', async () => {
        mockUseBookSearch.mockReturnValue({
            query: 'dup',
            setQuery: vi.fn(),
            results: [book],
            error: null,
            hasMore: false,
            isLoading: false,
            isFetchingNextPage: false,
            searchBooks: vi.fn(),
            loadMore: vi.fn(),
            addBookToLibrary: vi.fn().mockRejectedValue(new Error('Duplicate')),
        });

        render(<SearchPage />);
        fireEvent.click(screen.getByRole('button', { name: 'Duplicate Book' }));

        await waitFor(() => {
            expect(window.__searchAddResult).toBe('rejected');
        });
    });

    it('calls onBookAdded after a successful add', async () => {
        const onBookAdded = vi.fn();

        mockUseBookSearch.mockReturnValue({
            query: 'dup',
            setQuery: vi.fn(),
            results: [book],
            error: null,
            hasMore: false,
            isLoading: false,
            isFetchingNextPage: false,
            searchBooks: vi.fn(),
            loadMore: vi.fn(),
            addBookToLibrary: vi.fn().mockResolvedValue({ id: 1 }),
        });

        render(<SearchPage onBookAdded={onBookAdded} />);
        fireEvent.click(screen.getByRole('button', { name: 'Duplicate Book' }));

        await waitFor(() => {
            expect(window.__searchAddResult).toBe('resolved');
            expect(onBookAdded).toHaveBeenCalledTimes(1);
        });
    });

    it('shows and triggers the load more action when more results are available', () => {
        const loadMore = vi.fn();

        mockUseBookSearch.mockReturnValue({
            query: 'dup',
            setQuery: vi.fn(),
            results: [book],
            error: null,
            hasMore: true,
            isLoading: false,
            isFetchingNextPage: false,
            searchBooks: vi.fn(),
            loadMore,
            addBookToLibrary: vi.fn(),
        });

        render(<SearchPage />);
        fireEvent.click(screen.getByRole('button', { name: 'search.loadMore' }));

        expect(loadMore).toHaveBeenCalledTimes(1);
    });

    it('renders skeletons while loading and keeps the title mounted', () => {
        mockUseBookSearch.mockReturnValue({
            query: '',
            setQuery: vi.fn(),
            results: [],
            error: null,
            hasMore: true,
            isLoading: true,
            isFetchingNextPage: false,
            searchBooks: vi.fn(),
            loadMore: vi.fn(),
            addBookToLibrary: vi.fn(),
        });

        render(<SearchPage />);

        expect(screen.getByText('TypewriterTitle')).toBeInTheDocument();
        expect(screen.getAllByText('Skeleton')).toHaveLength(5);
        expect(screen.queryByText('search.endResults')).not.toBeInTheDocument();
    });

    it('shows the fetching-next-page state as a disabled loading button', () => {
        mockUseBookSearch.mockReturnValue({
            query: 'dup',
            setQuery: vi.fn(),
            results: [book],
            error: null,
            hasMore: true,
            isLoading: false,
            isFetchingNextPage: true,
            searchBooks: vi.fn(),
            loadMore: vi.fn(),
            addBookToLibrary: vi.fn(),
        });

        render(<SearchPage />);

        expect(screen.getByRole('button', { name: 'search.loading' })).toBeDisabled();
        expect(screen.queryByRole('button', { name: 'search.loadMore' })).not.toBeInTheDocument();
    });

    it('shows the end message and surfaces search errors', () => {
        mockUseBookSearch.mockReturnValue({
            query: 'dup',
            setQuery: vi.fn(),
            results: [book],
            error: 'Something went wrong',
            hasMore: false,
            isLoading: false,
            isFetchingNextPage: false,
            searchBooks: vi.fn(),
            loadMore: vi.fn(),
            addBookToLibrary: vi.fn(),
        });

        render(<SearchPage />);

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('search.endResults')).toBeInTheDocument();
    });

    it('does not call onBookAdded when addBookToLibrary returns a falsy value', async () => {
        const onBookAdded = vi.fn();

        mockUseBookSearch.mockReturnValue({
            query: 'dup',
            setQuery: vi.fn(),
            results: [book],
            error: null,
            hasMore: false,
            isLoading: false,
            isFetchingNextPage: false,
            searchBooks: vi.fn(),
            loadMore: vi.fn(),
            addBookToLibrary: vi.fn().mockResolvedValue(null),
        });

        render(<SearchPage onBookAdded={onBookAdded} />);
        fireEvent.click(screen.getByRole('button', { name: 'Duplicate Book' }));

        await waitFor(() => {
            expect(window.__searchAddResult).toBe('resolved');
        });

        expect(onBookAdded).not.toHaveBeenCalled();
    });

    it('keeps the idle empty state quiet when there are no results yet', () => {
        mockUseBookSearch.mockReturnValue({
            query: '',
            setQuery: vi.fn(),
            results: [],
            error: null,
            hasMore: false,
            isLoading: false,
            isFetchingNextPage: false,
            searchBooks: vi.fn(),
            loadMore: vi.fn(),
            addBookToLibrary: vi.fn(),
        });

        render(<SearchPage />);

        expect(screen.getByText('TypewriterTitle')).toBeInTheDocument();
        expect(screen.queryByText('search.endResults')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'search.loadMore' })).not.toBeInTheDocument();
        expect(screen.queryByText('Skeleton')).not.toBeInTheDocument();
    });
});
