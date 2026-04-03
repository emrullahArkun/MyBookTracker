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
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/9783161484100-L.jpg?default=false');
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
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/1234567890-L.jpg?default=false');

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
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/0987654321-L.jpg?default=false');

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
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/9780123456789-L.jpg?default=false');
    });

    it('prefers the largest available google image link from volumeInfo', () => {
        const book = {
            volumeInfo: {
                title: 'HiRes Book',
                imageLinks: {
                    thumbnail: 'https://books.google.com/thumb.jpg',
                    large: 'https://books.google.com/large.jpg',
                    extraLarge: 'https://books.google.com/extra-large.jpg',
                },
            }
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img.src).toBe('https://books.google.com/extra-large.jpg');
    });

    it('renders google thumbnails when no open library fallback exists', () => {
        const book = {
            volumeInfo: {
                title: 'Sharper Book',
                imageLinks: {
                    thumbnail: 'http://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=1&source=gbs_api',
                },
            }
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img.src).toContain('https://books.google.com/books/content');
        expect(img.src).toContain('zoom=3');
    });

    it('resets to the primary source when fallback sources change', () => {
        const book = {
            title: 'Fallback Reset Book',
            coverUrl: 'https://covers.openlibrary.org/b/id/99999-M.jpg',
            isbn: '1234567890',
        };

        const { rerender } = render(<BookCover book={book} />);

        let img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/id/99999-M.jpg');

        act(() => {
            simulateImageError(img);
        });

        img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/1234567890-L.jpg?default=false');

        rerender(
            <BookCover
                book={{
                    title: 'Fallback Reset Book',
                    coverUrl: 'https://covers.openlibrary.org/b/id/99999-M.jpg',
                }}
            />,
        );

        img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/id/99999-M.jpg');
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
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/0123456789-L.jpg?default=false');
    });

    it('prefers open library over google content thumbnails when isbn is available', () => {
        const book = {
            title: 'Edition With Placeholder Risk',
            isbn: '9783161484100',
            coverUrl: 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=3&source=gbs_api',
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/9783161484100-L.jpg?default=false');
    });

    it('keeps google covers with isbn when no thumbnail-size marker is present', () => {
        const book = {
            title: 'Google Cover Without Zoom',
            isbn: '9783161484100',
            coverUrl: 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&source=gbs_api',
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img.src).toContain('https://books.google.com/books/content');
        expect(img.src).not.toContain('/b/isbn/');
    });

    it('falls back to open library when google cover parsing fails for a thumbnail url', () => {
        const originalURL = global.URL;
        const failingUrl = 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=3&source=gbs_api';

        global.URL = class URLMock extends originalURL {
            constructor(url, base) {
                if (url === failingUrl) {
                    throw new TypeError('bad url');
                }

                super(url, base);
            }
        };

        try {
            render(
                <BookCover
                    book={{
                        title: 'Broken Google Cover',
                        isbn: '9783161484100',
                        coverUrl: failingUrl,
                    }}
                />,
            );

            const img = screen.getByRole('img');
            expect(img.src).toBe('https://covers.openlibrary.org/b/isbn/9783161484100-L.jpg?default=false');
        } finally {
            global.URL = originalURL;
        }
    });

    it('keeps google content thumbnails when no open library fallback exists', () => {
        const book = {
            title: 'Unsichere Ausgabe',
            authorName: 'Beispiel Autor',
            coverUrl: 'https://books.google.com/books/content?id=abc&printsec=frontcover&img=1&zoom=3&source=gbs_api',
        };

        render(<BookCover book={book} />);

        const img = screen.getByRole('img');
        expect(img.src).toContain('https://books.google.com/books/content');
        expect(img.src).toContain('zoom=3');
    });

    it('shows the unknown title fallback when no title exists', () => {
        render(<BookCover book={{}} />);

        expect(screen.queryByRole('img')).toBeNull();
        expect(screen.getByText('bookCover.unknownTitle')).toBeDefined();
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
