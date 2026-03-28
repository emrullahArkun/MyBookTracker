import { describe, expect, it } from 'vitest';
import { buildReadingRhythmSummary, buildResumeSuggestion, buildTodaySuggestion } from './homeInsights';
import type { Book } from '../../../shared/types/books';
import type { ReadingRhythm } from '../../../shared/types/stats';

const buildBook = (overrides: Partial<Book> = {}): Book => ({
    id: 1,
    isbn: null,
    title: 'The Left Hand of Darkness',
    authorName: 'Ursula K. Le Guin',
    publishYear: 1969,
    coverUrl: null,
    pageCount: 304,
    currentPage: 120,
    startDate: null,
    completed: false,
    readingGoalType: null,
    readingGoalPages: null,
    readingGoalProgress: null,
    categories: [],
    ...overrides,
});

const buildRhythm = (overrides: Partial<ReadingRhythm> = {}): ReadingRhythm => ({
    enoughData: true,
    preferredTimeOfDay: 'EVENING',
    preferredSessionLength: 'SHORT',
    activeDaysLast14: 4,
    sessionsLast14: 5,
    averagePagesPerSession: 18,
    averageMinutesPerSession: 22,
    ...overrides,
});

describe('homeInsights', () => {
    it('returns an empty today suggestion without a current book', () => {
        expect(buildTodaySuggestion(null, buildRhythm())).toEqual({ kind: 'empty' });
    });

    it('builds a finish suggestion for books near completion', () => {
        const result = buildTodaySuggestion(
            buildBook({ title: 'Piranesi', currentPage: 188, pageCount: 200 }),
            buildRhythm({ averagePagesPerSession: 16 })
        );

        expect(result.kind).toBe('finish');
        if (result.kind === 'finish') {
            expect(result.suggestedPages).toBe(12);
        }
    });

    it('builds a continue suggestion with a target page', () => {
        const result = buildTodaySuggestion(buildBook(), buildRhythm({ averagePagesPerSession: 14 }));

        expect(result.kind).toBe('continue');
        if (result.kind === 'continue') {
            expect(result.suggestedPages).toBe(14);
            expect(result.targetPage).toBe(134);
        }
    });

    it('clamps suggested pages when rhythm pages are below the cozy minimum', () => {
        const result = buildTodaySuggestion(
            buildBook({ currentPage: 20, pageCount: 220 }),
            buildRhythm({ averagePagesPerSession: 3 })
        );

        expect(result.kind).toBe('continue');
        if (result.kind === 'continue') {
            expect(result.suggestedPages).toBe(8);
            expect(result.targetPage).toBe(28);
        }
    });

    it('clamps suggested pages when rhythm pages are above the cozy maximum', () => {
        const result = buildTodaySuggestion(
            buildBook({ currentPage: 20, pageCount: 400 }),
            buildRhythm({ averagePagesPerSession: 60 })
        );

        expect(result.kind).toBe('continue');
        if (result.kind === 'continue') {
            expect(result.suggestedPages).toBe(30);
            expect(result.targetPage).toBe(50);
        }
    });

    it('falls back to a default target when the book has no page count', () => {
        const result = buildTodaySuggestion(
            buildBook({ pageCount: null, currentPage: 0 }),
            undefined
        );

        expect(result.kind).toBe('continue');
        if (result.kind === 'continue') {
            expect(result.suggestedPages).toBe(12);
            expect(result.targetPage).toBe(12);
            expect(result.remainingPages).toBeNull();
        }
    });

    it('prefers the current book for resume suggestions', () => {
        const result = buildResumeSuggestion(
            buildBook({ title: 'Dune', currentPage: 40 }),
            [buildBook({ id: 2, title: 'Hyperion' })]
        );

        expect(result).toEqual({
            kind: 'current',
            title: 'Dune',
            currentPage: 40,
        });
    });

    it('falls back to the queued book when the current book has not been started', () => {
        const result = buildResumeSuggestion(
            buildBook({ title: 'Dune', currentPage: 0 }),
            [buildBook({ id: 2, title: 'Hyperion', currentPage: 0 })]
        );

        expect(result).toEqual({
            kind: 'queued',
            title: 'Hyperion',
        });
    });

    it('returns an empty resume suggestion when there is nothing to continue', () => {
        expect(buildResumeSuggestion(null, [])).toEqual({ kind: 'empty' });
    });

    it('summarizes rhythm consistency from recent days', () => {
        const summary = buildReadingRhythmSummary(buildRhythm({ activeDaysLast14: 5, sessionsLast14: 6 }));

        expect(summary.consistency).toBe('steady');
        expect(summary.hasAnySessions).toBe(true);
        expect(summary.enoughData).toBe(true);
    });

    it('marks rhythm as growing with a few active days', () => {
        const summary = buildReadingRhythmSummary(buildRhythm({
            enoughData: false,
            activeDaysLast14: 3,
            sessionsLast14: 3,
        }));

        expect(summary.consistency).toBe('growing');
        expect(summary.enoughData).toBe(false);
    });

    it('marks rhythm as light with only one recent reading day', () => {
        const summary = buildReadingRhythmSummary(buildRhythm({
            activeDaysLast14: 1,
            sessionsLast14: 1,
        }));

        expect(summary.consistency).toBe('light');
        expect(summary.hasAnySessions).toBe(true);
    });

    it('returns empty rhythm defaults when there is no rhythm data', () => {
        const summary = buildReadingRhythmSummary(undefined);

        expect(summary).toEqual({
            enoughData: false,
            hasAnySessions: false,
            preferredTimeOfDay: 'UNKNOWN',
            preferredSessionLength: 'UNKNOWN',
            activeDaysLast14: 0,
            sessionsLast14: 0,
            averagePagesPerSession: 0,
            averageMinutesPerSession: 0,
            consistency: 'empty',
        });
    });
});
