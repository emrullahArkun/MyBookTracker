import { describe, it, expect } from 'vitest';
import { getOpenLibraryCoverUrl } from './coverUtils';

describe('coverUtils', () => {
    describe('getOpenLibraryCoverUrl', () => {
        it('returns OpenLibrary URL for valid ISBN', () => {
            expect(getOpenLibraryCoverUrl('9781234567890')).toBe('https://covers.openlibrary.org/b/isbn/9781234567890-M.jpg');
        });

        it('strips hyphens from ISBN', () => {
            expect(getOpenLibraryCoverUrl('978-1-234-56789-0')).toBe('https://covers.openlibrary.org/b/isbn/9781234567890-M.jpg');
        });

        it('returns empty string for ID: prefixed values', () => {
            expect(getOpenLibraryCoverUrl('ID:abc123')).toBe('');
        });

        it('returns empty string for short ISBNs', () => {
            expect(getOpenLibraryCoverUrl('123')).toBe('');
        });

        it('returns empty string for falsy values', () => {
            expect(getOpenLibraryCoverUrl(null)).toBe('');
            expect(getOpenLibraryCoverUrl(undefined)).toBe('');
            expect(getOpenLibraryCoverUrl('')).toBe('');
        });
    });
});
