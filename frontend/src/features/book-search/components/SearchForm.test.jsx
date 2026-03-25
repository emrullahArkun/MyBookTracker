import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SearchForm from './SearchForm';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
    }),
}));

describe('SearchForm', () => {
    it('should render search input', () => {
        render(<SearchForm query="" setQuery={vi.fn()} onSearch={vi.fn()} />);
        expect(screen.getByPlaceholderText('search.placeholder')).toBeDefined();
    });

    it('should call setQuery on input change', () => {
        const setQuery = vi.fn();
        render(<SearchForm query="" setQuery={setQuery} onSearch={vi.fn()} />);

        fireEvent.change(screen.getByPlaceholderText('search.placeholder'), {
            target: { value: 'test' },
        });

        expect(setQuery).toHaveBeenCalledTimes(1);
    });

    it('should call onSearch on form submit', () => {
        const onSearch = vi.fn((e) => e.preventDefault());
        render(<SearchForm query="test" setQuery={vi.fn()} onSearch={onSearch} />);

        fireEvent.submit(screen.getByRole('textbox'));

        expect(onSearch).toHaveBeenCalledTimes(1);
    });

    it('should show the current query value', () => {
        render(<SearchForm query="hello" setQuery={vi.fn()} onSearch={vi.fn()} />);
        expect(screen.getByDisplayValue('hello')).toBeDefined();
    });
});
