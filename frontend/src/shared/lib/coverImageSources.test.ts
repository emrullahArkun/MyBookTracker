import { describe, it, expect } from 'vitest';
import { getBestImageLink, buildCoverSources } from './coverImageSources';

describe('coverImageSources', () => {
    describe('getBestImageLink', () => {
        it('should return empty string for undefined imageLinks', () => {
            expect(getBestImageLink(undefined)).toBe('');
        });

        it('should prefer extraLarge over smaller sizes', () => {
            const result = getBestImageLink({
                extraLarge: 'https://example.com/xl.jpg',
                large: 'https://example.com/l.jpg',
                thumbnail: 'https://example.com/t.jpg',
            });
            expect(result).toBe('https://example.com/xl.jpg');
        });

        it('should fall back to smaller sizes', () => {
            expect(getBestImageLink({ thumbnail: 'https://example.com/t.jpg' }))
                .toBe('https://example.com/t.jpg');
            expect(getBestImageLink({ smallThumbnail: 'https://example.com/st.jpg' }))
                .toBe('https://example.com/st.jpg');
        });

        it('should upgrade zoom for Google Books URLs', () => {
            const result = getBestImageLink({
                thumbnail: 'http://books.google.com/books/content?id=abc&zoom=1&source=gbs_api',
            });
            expect(result).toContain('https://');
            expect(result).toContain('zoom=3');
        });

        it('should return empty string when all links are empty', () => {
            expect(getBestImageLink({})).toBe('');
        });
    });

    describe('buildCoverSources', () => {
        it('should return primary URL when no ISBN', () => {
            const sources = buildCoverSources('https://example.com/cover.jpg');
            expect(sources).toContain('https://example.com/cover.jpg');
        });

        it('should include OpenLibrary fallback when ISBN is provided', () => {
            const sources = buildCoverSources('https://example.com/cover.jpg', '9781234567890');
            expect(sources.some(s => s.includes('openlibrary.org'))).toBe(true);
        });

        it('should deduplicate URLs', () => {
            const url = 'https://example.com/cover.jpg';
            const sources = buildCoverSources(url, null);
            const unique = new Set(sources);
            expect(sources.length).toBe(unique.size);
        });

        it('should return empty array when no valid sources', () => {
            const sources = buildCoverSources('');
            expect(sources).toEqual([]);
        });

        it('should prefer OpenLibrary for small Google thumbnails', () => {
            const googleThumb = 'https://books.google.com/books/content?id=abc&zoom=1&source=gbs_api';
            const sources = buildCoverSources(googleThumb, '9781234567890');
            expect(sources[0]).toContain('openlibrary.org');
        });

        it('should include Google fallback URL with lower zoom', () => {
            const googleUrl = 'https://books.google.com/books/content?id=abc&zoom=3&source=gbs_api';
            const sources = buildCoverSources(googleUrl, null);
            const hasZoom1 = sources.some(s => s.includes('zoom=1'));
            expect(hasZoom1).toBe(true);
        });
    });
});
