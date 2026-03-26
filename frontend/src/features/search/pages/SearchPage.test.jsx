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
});
