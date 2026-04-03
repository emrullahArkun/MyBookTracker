import { describe, it, expect } from 'vitest';
import { formatLocalDate, parseLocalDate, getStartOfLocalWeek } from './date';

describe('date utilities', () => {
    describe('formatLocalDate', () => {
        it('should format a date as YYYY-MM-DD', () => {
            expect(formatLocalDate(new Date(2026, 0, 5))).toBe('2026-01-05');
            expect(formatLocalDate(new Date(2026, 11, 31))).toBe('2026-12-31');
        });

        it('should pad single-digit months and days', () => {
            expect(formatLocalDate(new Date(2026, 2, 3))).toBe('2026-03-03');
        });
    });

    describe('parseLocalDate', () => {
        it('should parse YYYY-MM-DD correctly', () => {
            const date = parseLocalDate('2026-03-15');
            expect(date.getFullYear()).toBe(2026);
            expect(date.getMonth()).toBe(2); // March = 2
            expect(date.getDate()).toBe(15);
        });

        it('should fall back to Date constructor for invalid format', () => {
            const date = parseLocalDate('March 15, 2026');
            expect(date.getFullYear()).toBe(2026);
        });
    });

    describe('getStartOfLocalWeek', () => {
        it('should return Monday for a Wednesday', () => {
            // 2026-03-25 is a Wednesday
            const wednesday = new Date(2026, 2, 25, 14, 30);
            const monday = getStartOfLocalWeek(wednesday);
            expect(monday.getDay()).toBe(1); // Monday
            expect(monday.getDate()).toBe(23);
            expect(monday.getHours()).toBe(0);
        });

        it('should return same day for a Monday', () => {
            // 2026-03-23 is a Monday
            const monday = new Date(2026, 2, 23, 10, 0);
            const start = getStartOfLocalWeek(monday);
            expect(start.getDay()).toBe(1);
            expect(start.getDate()).toBe(23);
        });

        it('should return previous Monday for a Sunday', () => {
            // 2026-03-29 is a Sunday
            const sunday = new Date(2026, 2, 29, 10, 0);
            const monday = getStartOfLocalWeek(sunday);
            expect(monday.getDay()).toBe(1);
            expect(monday.getDate()).toBe(23);
        });
    });
});
