import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBookGoalEditor } from './useBookGoalEditor';

// ── External dependency mocks ─────────────────────────────────────────────────

const mockToast = vi.fn();
vi.mock('@chakra-ui/react', () => ({
    useToast: () => mockToast,
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

const mockUpdateGoal = vi.fn();
vi.mock('../api', () => ({
    booksApi: {
        updateGoal: (...args: unknown[]) => mockUpdateGoal(...args),
    },
}));

// createAppToast just needs to pass something through to the toast function.
vi.mock('../../../shared/ui/AppToast', () => ({
    createAppToast: (options: unknown) => options,
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

import type { Book } from '../../../shared/types/books';

const buildBook = (overrides: Partial<Book> = {}): Book => ({
    id: 1,
    isbn: null,
    title: 'Test Book',
    authorName: 'Author',
    publishYear: null,
    coverUrl: null,
    pageCount: 300,
    currentPage: 50,
    startDate: null,
    completed: false,
    readingGoalType: null,
    readingGoalPages: null,
    readingGoalProgress: null,
    categories: [],
    ...overrides,
});

const defaultParams = {
    book: null as Book | null,
    bookId: '1',
    refetch: vi.fn(),
    onClose: vi.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useBookGoalEditor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('defaults goalType to WEEKLY and goalPages to empty string', () => {
            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book: null })
            );

            expect(result.current.goalType).toBe('WEEKLY');
            expect(result.current.goalPages).toBe('');
            expect(result.current.isSavingGoal).toBe(false);
        });
    });

    describe('synchronisation with the book prop', () => {
        it('populates goalType and goalPages from a book with a WEEKLY goal', () => {
            const book = buildBook({ readingGoalType: 'WEEKLY', readingGoalPages: 30 });

            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book })
            );

            expect(result.current.goalType).toBe('WEEKLY');
            expect(result.current.goalPages).toBe('30');
        });

        it('populates goalType and goalPages from a book with a MONTHLY goal', () => {
            const book = buildBook({ readingGoalType: 'MONTHLY', readingGoalPages: 120 });

            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book })
            );

            expect(result.current.goalType).toBe('MONTHLY');
            expect(result.current.goalPages).toBe('120');
        });

        it('does not change goalType when the book has no readingGoalType', () => {
            const book = buildBook({ readingGoalType: null, readingGoalPages: null });

            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book })
            );

            // goalType should remain at the default
            expect(result.current.goalType).toBe('WEEKLY');
            expect(result.current.goalPages).toBe('');
        });

        it('updates state when the book prop changes', () => {
            let book: Book | null = null;
            const { result, rerender } = renderHook(
                ({ book: b }: { book: Book | null }) =>
                    useBookGoalEditor({ ...defaultParams, book: b }),
                { initialProps: { book } }
            );

            expect(result.current.goalPages).toBe('');

            book = buildBook({ readingGoalType: 'MONTHLY', readingGoalPages: 60 });
            rerender({ book });

            expect(result.current.goalType).toBe('MONTHLY');
            expect(result.current.goalPages).toBe('60');
        });
    });

    describe('state setters', () => {
        it('setGoalType updates goalType', () => {
            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book: null })
            );

            act(() => {
                result.current.setGoalType('MONTHLY');
            });

            expect(result.current.goalType).toBe('MONTHLY');
        });

        it('setGoalPages updates goalPages', () => {
            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book: null })
            );

            act(() => {
                result.current.setGoalPages('25');
            });

            expect(result.current.goalPages).toBe('25');
        });
    });

    describe('handleSaveGoal – success path', () => {
        it('calls booksApi.updateGoal with the correct arguments', async () => {
            mockUpdateGoal.mockResolvedValueOnce({});

            const refetch = vi.fn();
            const onClose = vi.fn();
            const book = buildBook({ readingGoalType: 'WEEKLY', readingGoalPages: 20 });

            const { result } = renderHook(() =>
                useBookGoalEditor({
                    book,
                    bookId: '42',
                    refetch,
                    onClose,
                })
            );

            // Change the pages value before saving
            act(() => {
                result.current.setGoalPages('15');
            });

            await act(async () => {
                await result.current.handleSaveGoal();
            });

            expect(mockUpdateGoal).toHaveBeenCalledOnce();
            expect(mockUpdateGoal).toHaveBeenCalledWith(42, 'WEEKLY', 15);
        });

        it('shows a success toast after a successful save', async () => {
            mockUpdateGoal.mockResolvedValueOnce({});

            const { result } = renderHook(() =>
                useBookGoalEditor({
                    ...defaultParams,
                    book: buildBook({ readingGoalType: 'WEEKLY', readingGoalPages: 10 }),
                })
            );

            await act(async () => {
                await result.current.handleSaveGoal();
            });

            expect(mockToast).toHaveBeenCalledOnce();
            const toastArg = mockToast.mock.calls[0][0] as Record<string, unknown>;
            expect(toastArg).toMatchObject({
                title: 'bookStats.goal.modal.success',
                status: 'success',
            });
        });

        it('calls refetch and onClose after a successful save', async () => {
            mockUpdateGoal.mockResolvedValueOnce({});

            const refetch = vi.fn();
            const onClose = vi.fn();

            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book: null, refetch, onClose })
            );

            await act(async () => {
                await result.current.handleSaveGoal();
            });

            expect(refetch).toHaveBeenCalledOnce();
            expect(onClose).toHaveBeenCalledOnce();
        });

        it('resets isSavingGoal to false after a successful save', async () => {
            mockUpdateGoal.mockResolvedValueOnce({});

            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book: null })
            );

            await act(async () => {
                await result.current.handleSaveGoal();
            });

            expect(result.current.isSavingGoal).toBe(false);
        });
    });

    describe('handleSaveGoal – error path', () => {
        it('shows an error toast when the API call fails', async () => {
            mockUpdateGoal.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book: null })
            );

            await act(async () => {
                await result.current.handleSaveGoal();
            });

            expect(mockToast).toHaveBeenCalledOnce();
            const toastArg = mockToast.mock.calls[0][0] as Record<string, unknown>;
            expect(toastArg).toMatchObject({
                title: 'bookStats.goal.modal.error',
                status: 'error',
            });
        });

        it('does NOT call refetch or onClose when the API call fails', async () => {
            mockUpdateGoal.mockRejectedValueOnce(new Error('Network error'));

            const refetch = vi.fn();
            const onClose = vi.fn();

            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, refetch, onClose })
            );

            await act(async () => {
                await result.current.handleSaveGoal();
            });

            expect(refetch).not.toHaveBeenCalled();
            expect(onClose).not.toHaveBeenCalled();
        });

        it('resets isSavingGoal to false after a failed save', async () => {
            mockUpdateGoal.mockRejectedValueOnce(new Error('Network error'));

            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book: null })
            );

            await act(async () => {
                await result.current.handleSaveGoal();
            });

            expect(result.current.isSavingGoal).toBe(false);
        });
    });

    describe('isSavingGoal during save', () => {
        it('is true while the API call is in-flight', async () => {
            let resolveGoal!: (value: unknown) => void;
            mockUpdateGoal.mockReturnValueOnce(
                new Promise((resolve) => { resolveGoal = resolve; })
            );

            const { result } = renderHook(() =>
                useBookGoalEditor({ ...defaultParams, book: null })
            );

            act(() => {
                void result.current.handleSaveGoal();
            });

            await waitFor(() => {
                expect(result.current.isSavingGoal).toBe(true);
            });

            // Settle the promise so the hook can clean up
            await act(async () => {
                resolveGoal({});
            });

            expect(result.current.isSavingGoal).toBe(false);
        });
    });
});
