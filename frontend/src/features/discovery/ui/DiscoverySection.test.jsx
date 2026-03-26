import { act, fireEvent, render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DiscoverySection from './DiscoverySection';
import * as AnimationProviderModule from '../../../app/providers/AnimationProvider';

const mockMutateAsync = vi.fn();
const mockFlyBook = vi.fn();
const mockBookCover = vi.fn();

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../model/useAddDiscoveryBook.jsx', () => ({
    useAddDiscoveryBook: () => ({
        mutateAsync: mockMutateAsync,
    }),
}));

vi.mock('../../../shared/ui/BookCover', () => ({
    default: forwardRef((props, ref) => {
        mockBookCover(props);
        return <div ref={ref}>{props.book.title}</div>;
    }),
}));

describe('DiscoverySection', () => {
    const book = {
        title: 'Discovery Book',
        authors: ['Author'],
        isbn: '9781234567890',
        coverUrl: 'http://test.com/cover.jpg',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AnimationProviderModule, 'useAnimation').mockReturnValue({
            flyBook: mockFlyBook,
        });
        mockMutateAsync.mockResolvedValue(undefined);
    });

    const renderSection = () => render(
        <DiscoverySection
            title="By author"
            subtitle="Author"
            iconType="author"
            books={[book]}
            emptyMessage="No books"
        />
    );

    it('does not trigger the fly animation when adding the book fails', async () => {
        mockMutateAsync.mockRejectedValue(new Error('Duplicate book'));
        renderSection();

        await act(async () => {
            fireEvent.click(screen.getByRole('button'));
        });

        expect(mockMutateAsync).toHaveBeenCalledWith(book);
        expect(mockFlyBook).not.toHaveBeenCalled();
    });

    it('triggers the fly animation after a successful add', async () => {
        renderSection();

        await act(async () => {
            fireEvent.click(screen.getByRole('button'));
        });

        expect(mockMutateAsync).toHaveBeenCalledWith(book);
        expect(mockFlyBook).toHaveBeenCalledTimes(1);
        expect(mockFlyBook.mock.calls[0][1]).toBe('http://test.com/cover.jpg');
    });

    it('supports keyboard add on Enter and ignores unrelated keys', async () => {
        renderSection();
        const card = screen.getByRole('button');

        await act(async () => {
            fireEvent.keyDown(card, { key: 'Enter' });
        });
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);

        fireEvent.keyDown(card, { key: 'Escape' });
        expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    it('renders the empty state and default icon fallback when no books exist', () => {
        render(
            <DiscoverySection
                title="Fallback"
                iconType="unknown"
                books={[]}
                emptyMessage="No recommendations yet"
            />
        );

        expect(screen.getByText('Fallback')).toBeInTheDocument();
        expect(screen.getByText('No recommendations yet')).toBeInTheDocument();
    });

    it('renders the unknown author fallback and omits imageLinks when no cover exists', () => {
        render(
            <DiscoverySection
                title="By search"
                subtitle="query"
                iconType="search"
                books={[{
                    title: 'No Cover Book',
                    authors: null,
                    isbn: '111',
                    coverUrl: '',
                }]}
                emptyMessage="No books"
            />
        );

        expect(screen.getByText('discovery.unknownAuthor')).toBeInTheDocument();
        expect(mockBookCover).toHaveBeenCalledWith(expect.objectContaining({
            book: expect.objectContaining({
                imageLinks: undefined,
            }),
        }));
    });
});
