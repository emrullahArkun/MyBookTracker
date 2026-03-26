import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import { describe, it, expect } from 'vitest';
import BookCover from './BookCover';

describe('BookCover', () => {
    // Helper to simulate an img element loading or failing
    const simulateImageLoad = (imgElement, width = 200, height = 300) => {
        Object.defineProperty(imgElement, 'naturalWidth', { value: width, configurable: true });
        Object.defineProperty(imgElement, 'naturalHeight', { value: height, configurable: true });
        fireEvent.load(imgElement);
    };

    const simulateImageError = (imgElement) => {
        fireEvent.error(imgElement);
    };

    it('renders with a given coverUrl successfully', async () => {
        const book = {
            title: 'Test Book',
            coverUrl: 'https://covers.openlibrary.org/b/id/12345-M.jpg',
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img).toBeDefined();
        expect(img.src).toBe('https://covers.openlibrary.org/b/id/12345-M.jpg');

        act(() => {
            simulateImageLoad(img);
        });

        // Ensure no fallback text is rendered
        expect(screen.queryByText('Test Book')).toBeNull();
    });

    it('falls back to ISBN-based OpenLibrary URL if no coverUrl', () => {
        const book = {
            title: 'ISBN Only Book',
            isbn: '9783161484100',
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/9783161484100-M.jpg');
    });

    it('falls back to title/author text if no image URL is possible', () => {
        const book = {
            title: 'No Image Ever',
            authorName: 'Mystery Writer',
        };

        render(<BookCover book={book} />);

        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('No Image Ever')).toBeDefined();
        expect(screen.getByText('Mystery Writer')).toBeDefined();
    });

    it('shows title fallback if coverUrl image errors and no ISBN', () => {
        const book = {
            title: 'Error Book',
            coverUrl: 'https://covers.openlibrary.org/b/id/99999-M.jpg',
        };

        render(<BookCover book={book} />);

        let img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/id/99999-M.jpg');

        act(() => {
            simulateImageError(img);
        });

        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('Error Book')).toBeDefined();
    });

    it('falls back to ISBN URL on primary error, then to text on second error', () => {
        const book = {
            title: 'Double Error Book',
            coverUrl: 'https://covers.openlibrary.org/b/id/99999-M.jpg',
            isbn: '1234567890',
        };

        render(<BookCover book={book} />);

        let img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/id/99999-M.jpg');

        act(() => {
            simulateImageError(img); // Primary fails
        });

        // Tries ISBN-based URL
        img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/1234567890-M.jpg');

        act(() => {
            simulateImageError(img); // ISBN fallback fails
        });

        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('Double Error Book')).toBeDefined();
    });

    it('detects OpenLibrary 1x1 pixel image as error and falls back', () => {
        const book = {
            title: '1x1 Pixel Book',
            isbn: '0987654321',
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/0987654321-M.jpg');

        act(() => {
            simulateImageLoad(img, 1, 1);
        });

        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('1x1 Pixel Book')).toBeDefined();
    });

    it('extracts author array properly', () => {
        const book = {
            title: 'Multi Author Book',
            authors: ['Admin One', 'Admin Two'],
        };
        render(<BookCover book={book} />);
        expect(screen.getByText('Admin One')).toBeDefined();
    });

    it('supports volumeInfo wrapper for MyBooks compatibility', () => {
        const book = {
            volumeInfo: {
                title: 'Legacy Book',
                industryIdentifiers: [{ type: 'ISBN_13', identifier: '9780123456789' }],
            }
        };
        render(<BookCover book={book} />);
        const img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/9780123456789-M.jpg');
    });

    it('falls back to ISBN_10 when ISBN_13 is not available', () => {
        const book = {
            volumeInfo: {
                title: 'Isbn10 Book',
                industryIdentifiers: [{ type: 'ISBN_10', identifier: '0123456789' }],
            }
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/0123456789-M.jpg');
    });

    it('shows the unknown title fallback when no title exists', () => {
        render(<BookCover book={{}} />);

        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('Unbekannter Titel')).toBeDefined();
    });

    it('marks cached images as loaded immediately when the ref receives a completed image', () => {
        const book = {
            title: 'Cached Book',
            coverUrl: 'https://covers.openlibrary.org/b/id/11111-M.jpg',
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img).toBeDefined();

        Object.defineProperty(img, 'complete', { value: true, configurable: true });
        Object.defineProperty(img, 'naturalWidth', { value: 200, configurable: true });

        act(() => {
            simulateImageLoad(img);
        });

        expect(screen.queryByText('Cached Book')).toBeNull();
    });

    it('updates the image source when the book cover URL changes', () => {
        const { rerender } = render(<BookCover book={{
            title: 'Updated Book',
            coverUrl: 'https://covers.openlibrary.org/b/id/11111-M.jpg',
        }}
        />);

        let img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/id/11111-M.jpg');

        rerender(<BookCover book={{
            title: 'Updated Book',
            coverUrl: 'https://covers.openlibrary.org/b/id/22222-M.jpg',
        }}
        />);

        img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/id/22222-M.jpg');
    });

    it('supports forwarded object refs', () => {
        const ref = createRef();
        render(<BookCover
            ref={ref}
            book={{
                title: 'Forward Ref Book',
                coverUrl: 'https://covers.openlibrary.org/b/id/33333-M.jpg',
            }}
        />);

        expect(ref.current).toBe(screen.getByRole('img'));
    });
});
