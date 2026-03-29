import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAddDiscoveryBook } from './useAddDiscoveryBook';

let mockAuthState = {
    token: 'test-token',
    user: { email: 'reader@example.com' },
};

const mockToast = vi.fn();
const mockClose = vi.fn();
const mockIsActive = vi.fn(() => false);
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockBuildLibraryBookPayload = vi.fn((book) => ({ isbn: book.isbn, title: book.title }));

vi.mock('../../auth/model', () => ({
    useAuth: () => mockAuthState,
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('@chakra-ui/react', async () => {
    const actual = await vi.importActual('@chakra-ui/react');
    return {
        ...actual,
        useToast: () => {
            mockToast.close = mockClose;
            mockToast.isActive = mockIsActive;
            mockToast.update = mockUpdate;
            return mockToast;
        },
    };
});

vi.mock('../../library/api', () => ({
    booksApi: {
        create: (...args) => mockCreate(...args),
    },
    buildLibraryBookPayload: (...args) => mockBuildLibraryBookPayload(...args),
}));

const createQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

describe('useAddDiscoveryBook', () => {
    let queryClient;

    const wrapper = ({ children }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = createQueryClient();
        mockAuthState = {
            token: 'test-token',
            user: { email: 'reader@example.com' },
        };
        mockCreate.mockResolvedValue({ id: 99 });
    });

    it('removes the added book from cached discovery sections without invalidating discovery', async () => {
        queryClient.setQueryData(['discovery', 'reader@example.com'], {
            byAuthor: {
                authors: ['Author'],
                books: [
                    { isbn: 'keep-author', title: 'Keep Author' },
                    { isbn: 'remove-me', title: 'Remove Me' },
                ],
            },
            byCategory: {
                categories: ['Category'],
                books: [
                    { isbn: 'remove-me', title: 'Remove Me' },
                    { isbn: 'keep-category', title: 'Keep Category' },
                ],
            },
            bySearch: {
                queries: ['query'],
                books: [
                    { isbn: 'keep-search', title: 'Keep Search' },
                    { isbn: 'remove-me', title: 'Remove Me' },
                ],
            },
        });

        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
        const { result } = renderHook(() => useAddDiscoveryBook(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ isbn: 'remove-me', title: 'Remove Me' });
        });

        await waitFor(() => {
            expect(queryClient.getQueryData(['discovery', 'reader@example.com']).byAuthor.books)
                .toEqual([{ isbn: 'keep-author', title: 'Keep Author' }]);
        });

        const discoveryData = queryClient.getQueryData(['discovery', 'reader@example.com']);
        expect(discoveryData.byCategory.books).toEqual([{ isbn: 'keep-category', title: 'Keep Category' }]);
        expect(discoveryData.bySearch.books).toEqual([{ isbn: 'keep-search', title: 'Keep Search' }]);
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['myBooks'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['ownedIsbns', 'reader@example.com'] });
        expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['discovery'] });
        expect(mockBuildLibraryBookPayload).toHaveBeenCalledWith({ isbn: 'remove-me', title: 'Remove Me' });
        expect(mockToast).toHaveBeenCalled();
    });

    it('handles a successful add even when no discovery cache is present', async () => {
        const { result } = renderHook(() => useAddDiscoveryBook(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync({ isbn: 'new-book', title: 'New Book' });
        });

        expect(queryClient.getQueryData(['discovery', 'reader@example.com'])).toBeUndefined();
        expect(mockCreate).toHaveBeenCalled();
        expect(mockToast).toHaveBeenCalledTimes(1);
    });

    it('shows the duplicate toast when the add fails with status 409', async () => {
        mockCreate.mockRejectedValue({ status: 409 });
        const { result } = renderHook(() => useAddDiscoveryBook(), { wrapper });

        await expect(result.current.mutateAsync({ isbn: 'dup', title: 'Duplicate' })).rejects.toEqual({ status: 409 });

        const toastConfig = mockToast.mock.calls[0][0];
        render(toastConfig.render());
        expect(screen.getByText('search.toast.duplicate')).toBeInTheDocument();
    });

    it('shows the generic failure toast when the add fails without a duplicate status', async () => {
        mockCreate.mockRejectedValue({});
        const { result } = renderHook(() => useAddDiscoveryBook(), { wrapper });

        await expect(result.current.mutateAsync({ isbn: 'fail', title: 'Failure' })).rejects.toEqual({});

        render(mockToast.mock.calls[0][0].render());
        expect(screen.getByText('search.toast.addFailed')).toBeInTheDocument();
    });

    it('throws a login-required error when there is no auth token', async () => {
        mockAuthState = { token: null, user: null };
        const { result } = renderHook(() => useAddDiscoveryBook(), { wrapper });

        await expect(result.current.mutateAsync({ isbn: 'locked', title: 'Locked' }))
            .rejects.toThrow('search.toast.loginRequired');

        expect(mockCreate).not.toHaveBeenCalled();
    });
});
