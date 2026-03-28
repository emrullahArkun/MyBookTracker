import { describe, expect, it } from 'vitest';
import { buildLibraryBookPayload } from './libraryBookPayload';

describe('buildLibraryBookPayload', () => {
    it('keeps explicit values when they are already present', () => {
        const payload = buildLibraryBookPayload({
            title: 'Domain Modeling',
            isbn: '9783161484100',
            coverUrl: 'https://example.com/cover.jpg',
            authors: ['Eric Evans', 'Someone Else'],
            publishYear: 2003,
            pageCount: 560,
            categories: ['Architecture', 'DDD'],
        });

        expect(payload).toEqual({
            title: 'Domain Modeling',
            isbn: '9783161484100',
            authorName: 'Eric Evans',
            publishYear: 2003,
            coverUrl: 'https://example.com/cover.jpg',
            pageCount: 560,
            categories: ['Architecture', 'DDD'],
        });
    });

    it('builds fallback defaults for missing optional fields', () => {
        const payload = buildLibraryBookPayload({
            title: 'No Metadata',
            authors: undefined,
            categories: undefined,
        });

        expect(payload).toEqual({
            title: 'No Metadata',
            isbn: null,
            authorName: 'Unknown Author',
            publishYear: null,
            coverUrl: '',
            pageCount: 0,
            categories: [],
        });
    });

    it('wraps a single category value and keeps a single author string', () => {
        const payload = buildLibraryBookPayload({
            title: 'Single Values',
            authors: 'One Author',
            categories: 'Fantasy',
            pageCount: 321,
        });

        expect(payload).toEqual({
            title: 'Single Values',
            isbn: null,
            authorName: 'One Author',
            publishYear: null,
            coverUrl: '',
            pageCount: 321,
            categories: ['Fantasy'],
        });
    });

    it('builds an Open Library cover URL from the isbn when no coverUrl exists', () => {
        const payload = buildLibraryBookPayload({
            title: 'Fallback Cover',
            isbn: '1234567890',
            authors: ['Fallback Author'],
            categories: [],
        });

        expect(payload.coverUrl).toBe('https://covers.openlibrary.org/b/isbn/1234567890-M.jpg?default=false');
        expect(payload.isbn).toBe('1234567890');
    });
});
