import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchForm from './SearchForm';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
    }),
}));

describe('SearchForm', () => {
    const baseProps = {
        query: '',
        setQuery: vi.fn(),
        onSearch: vi.fn(),
        recentSearches: [],
        isHistoryOpen: false,
        onOpenHistory: vi.fn(),
        onCloseHistory: vi.fn(),
        onSelectRecentSearch: vi.fn(),
    };

    it('should render search input', () => {
        render(<SearchForm {...baseProps} />);
        const input = screen.getByPlaceholderText('search.placeholder');
        expect(input).toBeDefined();
        expect(input).toHaveAttribute('aria-expanded', 'false');
        expect(input).not.toHaveAttribute('aria-controls');
    });

    it('should call setQuery on input change', () => {
        const setQuery = vi.fn();
        render(<SearchForm {...baseProps} setQuery={setQuery} />);

        fireEvent.change(screen.getByPlaceholderText('search.placeholder'), {
            target: { value: 'test' },
        });

        expect(setQuery).toHaveBeenCalledTimes(1);
    });

    it('should call onSearch on form submit', () => {
        const onSearch = vi.fn();
        render(<SearchForm {...baseProps} query="test" onSearch={onSearch} />);

        fireEvent.submit(screen.getByRole('textbox'));

        expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('should show the current query value', () => {
        render(<SearchForm {...baseProps} query="hello" />);
        expect(screen.getByDisplayValue('hello')).toBeDefined();
    });

    it('should open history on input focus', () => {
        const onOpenHistory = vi.fn();
        render(<SearchForm {...baseProps} onOpenHistory={onOpenHistory} />);

        fireEvent.focus(screen.getByRole('textbox'));

        expect(onOpenHistory).toHaveBeenCalledTimes(1);
    });

    it('should render recent searches and allow selecting one', () => {
        const onSelectRecentSearch = vi.fn();
        render(
            <SearchForm
                {...baseProps}
                recentSearches={['Dune', 'Sapiens']}
                isHistoryOpen
                onSelectRecentSearch={onSelectRecentSearch}
            />,
        );

        fireEvent.click(screen.getByRole('button', { name: /Dune/i }));

        expect(screen.getByRole('list', { name: 'search.recentSearches' })).toBeInTheDocument();
        expect(onSelectRecentSearch).toHaveBeenCalledWith('Dune');
    });

    it('should close history when clicking outside the search shell', () => {
        const onCloseHistory = vi.fn();
        render(
            <div>
                <SearchForm
                    {...baseProps}
                    recentSearches={['Dune']}
                    isHistoryOpen
                    onCloseHistory={onCloseHistory}
                />
                <button type="button">Outside</button>
            </div>,
        );

        fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));

        expect(onCloseHistory).toHaveBeenCalledTimes(1);
    });

    it('should keep history open when clicking inside the search shell', () => {
        const onCloseHistory = vi.fn();
        render(
            <SearchForm
                {...baseProps}
                recentSearches={['Dune']}
                isHistoryOpen
                onCloseHistory={onCloseHistory}
            />,
        );

        fireEvent.mouseDown(screen.getByRole('button', { name: /Dune/i }));

        expect(onCloseHistory).not.toHaveBeenCalled();
    });

    it('should keep history open when focus stays inside the search shell', () => {
        const onCloseHistory = vi.fn();
        render(
            <SearchForm
                {...baseProps}
                recentSearches={['Dune']}
                isHistoryOpen
                onCloseHistory={onCloseHistory}
            />,
        );

        fireEvent.focusIn(screen.getByRole('button', { name: /Dune/i }));

        expect(onCloseHistory).not.toHaveBeenCalled();
    });

    it('should close history when focus moves outside the search shell', () => {
        const onCloseHistory = vi.fn();
        render(
            <div>
                <SearchForm
                    {...baseProps}
                    recentSearches={['Dune']}
                    isHistoryOpen
                    onCloseHistory={onCloseHistory}
                />
                <button type="button">Outside</button>
            </div>,
        );

        fireEvent.focusIn(screen.getByRole('button', { name: 'Outside' }));

        expect(onCloseHistory).toHaveBeenCalledTimes(1);
    });

    it('should close history when Escape is pressed', () => {
        const onCloseHistory = vi.fn();
        render(
            <SearchForm
                {...baseProps}
                recentSearches={['Dune']}
                isHistoryOpen
                onCloseHistory={onCloseHistory}
            />,
        );

        fireEvent.keyDown(document, { key: 'Escape' });

        expect(onCloseHistory).toHaveBeenCalledTimes(1);
    });

    it('should ignore non-Escape key presses while history is open', () => {
        const onCloseHistory = vi.fn();
        render(
            <SearchForm
                {...baseProps}
                recentSearches={['Dune']}
                isHistoryOpen
                onCloseHistory={onCloseHistory}
            />,
        );

        fireEvent.keyDown(document, { key: 'Enter' });

        expect(onCloseHistory).not.toHaveBeenCalled();
    });
});
