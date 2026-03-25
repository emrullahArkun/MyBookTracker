import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchResultCard from './SearchResultCard';
import * as AnimationContextModule from '../../../context/AnimationContext';

// Mock translations
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

// Mock googleBooks utils
vi.mock('../../../utils/googleBooks', () => ({
    getOpenLibraryCoverUrl: (isbn) => isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg` : '',
}));

describe('SearchResultCard', () => {
    const mockBook = {
        title: 'Test Book',
        authors: ['Test Author'],
        isbn: '9781234567890',
        coverUrl: 'http://test.com/img.jpg',
        publishYear: 2023,
        pageCount: 200,
    };

    const mockFlyBook = vi.fn();
    const mockOnAdd = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AnimationContextModule, 'useAnimation').mockReturnValue({
            flyBook: mockFlyBook
        });
    });

    const renderCard = () => {
        return render(
            <SearchResultCard book={mockBook} onAdd={mockOnAdd} />
        );
    };

    it('triggers animation and calls onAdd', async () => {
        renderCard();
        const card = screen.getByRole('button');

        await act(async () => {
            fireEvent.click(card);
        });

        expect(mockFlyBook).toHaveBeenCalled();
        expect(mockOnAdd).toHaveBeenCalledWith(mockBook);
    });

    it('triggers handleAddClick on Enter key press', async () => {
        renderCard();
        const card = screen.getByRole('button');

        await act(async () => {
            fireEvent.keyDown(card, { key: 'Enter' });
        });
        expect(mockOnAdd).toHaveBeenCalled();
    });

    it('triggers handleAddClick on Space key press', async () => {
        mockOnAdd.mockClear();
        renderCard();
        const card = screen.getByRole('button');

        await act(async () => {
            fireEvent.keyDown(card, { key: ' ' });
        });
        expect(mockOnAdd).toHaveBeenCalled();
    });

    it('ignores keydown for other keys', () => {
        mockOnAdd.mockClear();
        renderCard();
        const card = screen.getByRole('button');

        fireEvent.keyDown(card, { key: 'Escape' });
        expect(mockOnAdd).not.toHaveBeenCalled();
    });

    it('prevents multiple additive requests (double click guard)', async () => {
        mockOnAdd.mockClear();
        let resolveAdd;
        mockOnAdd.mockImplementation(() => new Promise((resolve) => {
            resolveAdd = resolve;
        }));

        renderCard();
        const card = screen.getByRole('button');

        await act(async () => {
            fireEvent.click(card);
        });
        expect(mockOnAdd).toHaveBeenCalledTimes(1);

        await act(async () => {
            fireEvent.click(card);
        });
        expect(mockOnAdd).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveAdd();
        });
    });
});
