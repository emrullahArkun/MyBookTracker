import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../auth/model/AuthContext';
import LibraryPage from './LibraryPage';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';
// Mock translations
import '../../../app/i18n';

const mockNavigate = vi.fn();
const mockReadingSessionContext = vi.fn();
const mockToast = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../reading-session', () => ({
    ReadingSessionProvider: ({ children }) => children,
    useReadingSessionContext: () => mockReadingSessionContext(),
}));

vi.mock('@chakra-ui/react', async () => {
    const actual = await vi.importActual('@chakra-ui/react');
    return {
        ...actual,
        useToast: () => mockToast,
    };
});

// Utility wrapper for tests
const createTestWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return ({ children }) => (
        <AuthContext.Provider value={{ token: 'fake-token', user: { email: 'test@example.com' } }}>
            <QueryClientProvider client={queryClient}>
                <MemoryRouter>
                    {children}
                </MemoryRouter>
            </QueryClientProvider>
        </AuthContext.Provider>
    );
};

const createSectionPage = (content) => ({
    content,
    totalElements: content.length,
    totalPages: content.length > 0 ? 1 : 0,
    size: 4,
    number: 0,
});

const mockLibrarySections = ({ current = [], next = [], finished = [] }) => {
    server.use(
        http.get('/api/books/sections/:section', ({ params }) => {
            const section = String(params.section);
            const data = { current, next, finished };
            return HttpResponse.json(createSectionPage(data[section] || []));
        })
    );
};

describe('MyBooks Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
        mockToast.mockClear();
        mockReadingSessionContext.mockReturnValue({ activeSession: null });
    });

    it('shows loading state initially', () => {
        render(<LibraryPage />, { wrapper: createTestWrapper() });
        expect(screen.getByText(/Loading library.../i)).toBeInTheDocument();
    });

    it('renders books from API', async () => {
        render(<LibraryPage />, { wrapper: createTestWrapper() });

        // Wait for Loading to finish and book to appear
        const book1Cover = await screen.findByAltText('Test Book 1');
        expect(book1Cover).toBeInTheDocument();

        const book2Cover = await screen.findByAltText('Test Book 2');
        expect(book2Cover).toBeInTheDocument();
    });

    it('toggles book selection', async () => {
        const user = userEvent.setup();
        render(<LibraryPage />, { wrapper: createTestWrapper() });

        // Wait for books to load
        const bookCover = await screen.findByAltText('Test Book 1');
        const bookCard = bookCover.closest('div[role="group"]');

        // Find the selection checkbox within the card
        const checkbox = within(bookCard).getByRole('checkbox');

        // Click it to select
        await user.click(checkbox);

        // "Delete (1)" button should appear indicating selection
        await waitFor(() => {
            expect(screen.getByText(/Delete \(1\)/i)).toBeInTheDocument();
        });
    });

    it('handles API errors gracefully', async () => {
        // Override the handler to return an error for this test
        server.use(
            http.get('/api/books/sections/:section', () => {
                return new HttpResponse(null, { status: 500 });
            })
        );

        render(<LibraryPage />, { wrapper: createTestWrapper() });

        // Expect error message to appear
        await waitFor(() => {
            expect(screen.getByText(/Error:/i)).toBeInTheDocument();
        });
    });

    it('renders empty state when no books exist', async () => {
        mockLibrarySections({ current: [], next: [], finished: [] });
        render(<LibraryPage />, { wrapper: createTestWrapper() });
        expect(await screen.findByText('No books in your library yet.')).toBeInTheDocument();
        expect(await screen.findByText('Go to search to add books!')).toBeInTheDocument();
        expect(screen.queryByText('Delete All')).not.toBeInTheDocument();
    });

    it('groups books into current, next, and finished sections', async () => {
        mockLibrarySections({
            current: [{ id: 1, title: 'Current Book', authorName: 'Author 1', currentPage: 45, pageCount: 300, completed: false, coverUrl: 'http://example.com/current.jpg', user: { id: 1 } }],
            next: [{ id: 2, title: 'Next Book', authorName: 'Author 2', currentPage: 0, pageCount: 250, completed: false, readingGoalType: 'WEEKLY', coverUrl: 'http://example.com/next.jpg', user: { id: 1 } }],
            finished: [{ id: 3, title: 'Finished Book', authorName: 'Author 3', currentPage: 210, pageCount: 210, completed: true, coverUrl: 'http://example.com/finished.jpg', user: { id: 1 } }],
        });

        render(<LibraryPage />, { wrapper: createTestWrapper() });

        expect(await screen.findByText('Books already in motion should be the easiest ones to continue.')).toBeInTheDocument();
        expect(screen.getByText('Books you can ease into whenever you are ready.')).toBeInTheDocument();
        expect(screen.getByText('Completed books stay visible, but out of the way.')).toBeInTheDocument();
        expect(screen.getByText('Books already in motion should be the easiest ones to continue.')).toBeInTheDocument();
    });

    it('prioritizes the active session book and uses the active-session hint', async () => {
        mockReadingSessionContext.mockReturnValue({ activeSession: { bookId: 2 } });
        mockLibrarySections({
            current: [
                { id: 2, title: 'Active Session Book', authorName: 'Author 2', currentPage: 20, pageCount: 200, completed: false, coverUrl: 'http://example.com/active.jpg', user: { id: 1 } },
                { id: 1, title: 'Later Current Book', authorName: 'Author 1', currentPage: 90, pageCount: 300, completed: false, coverUrl: 'http://example.com/later.jpg', user: { id: 1 } },
            ],
        });

        render(<LibraryPage />, { wrapper: createTestWrapper() });

        expect(await screen.findByText('Your active session stays at the front so you can jump back in quickly.')).toBeInTheDocument();

        const currentReadCards = await screen.findAllByRole('img');
        expect(currentReadCards[0]).toHaveAttribute('alt', 'Active Session Book');
    });

    it('hides sections that have no books', async () => {
        mockLibrarySections({
            finished: [{ id: 3, title: 'Finished Only', authorName: 'Author 3', currentPage: 210, pageCount: 210, completed: true, coverUrl: 'http://example.com/finished-only.jpg', user: { id: 1 } }],
        });

        render(<LibraryPage />, { wrapper: createTestWrapper() });

        expect(await screen.findByText('Completed books stay visible, but out of the way.')).toBeInTheDocument();
        expect(screen.queryByText('Books already in motion should be the easiest ones to continue.')).not.toBeInTheDocument();
        expect(screen.queryByText('Books you can ease into whenever you are ready.')).not.toBeInTheDocument();
    });

    it('shows a toast when deleting selected books fails', async () => {
        mockLibrarySections({
            current: [{ id: 1, title: 'Test Book 1', authorName: 'Author 1', coverUrl: 'http://example.com/cover1.jpg', readingProgress: 0, pageCount: 300, completed: false, user: { id: 1 } }],
        });
        server.use(http.delete('/api/books/1', () => new HttpResponse(null, { status: 500 })));

        const user = userEvent.setup();
        render(<LibraryPage />, { wrapper: createTestWrapper() });

        const book1Cover = await screen.findByAltText('Test Book 1');
        const checkbox = within(book1Cover.closest('div[role="group"]')).getByRole('checkbox');
        await user.click(checkbox);

        await user.click(await screen.findByText(/Delete \(1\)/i));
        const dialog = screen.getByRole('alertdialog');
        await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledTimes(1);
        });

        render(mockToast.mock.calls[0][0].render());
        expect(screen.getByText(/Error:/i)).toBeInTheDocument();
    });

    it('navigates to search when clicking the search button in empty state', async () => {
        const user = userEvent.setup();
        mockLibrarySections({ current: [], next: [], finished: [] });
        render(<LibraryPage />, { wrapper: createTestWrapper() });
        const searchBtn = await screen.findByText('Search');
        await user.click(searchBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/search');
    });

    describe('Selection & Bulk Delete', () => {
        it('toggles selection and deletes selected books', async () => {
            mockLibrarySections({
                current: [{ id: 1, title: 'Test Book 1', authorName: 'Author 1', coverUrl: 'http://example.com/cover1.jpg', readingProgress: 0, pageCount: 300, completed: false, user: { id: 1 } }],
            });
            const user = userEvent.setup();
            render(<LibraryPage />, { wrapper: createTestWrapper() });

            // Wait for books
            const book1Cover = await screen.findByAltText('Test Book 1');
            // Click the selection checkbox
            const checkbox = within(book1Cover.closest('div[role="group"]')).getByRole('checkbox');
            await user.click(checkbox);

            // "Delete Selected" button should appear
            const delSelBtn = await screen.findByText(/Delete \(1\)/i);
            expect(delSelBtn).toBeInTheDocument();

            // Open dialog
            await user.click(delSelBtn);
            expect(await screen.findByText('Delete Selected Books?')).toBeInTheDocument();

            // Setup mock for delete
            server.use(
                http.delete('/api/books/bulk', () => {
                    return new HttpResponse(null, { status: 204 });
                })
            );

            // Confirm
            const dialog = screen.getByRole('alertdialog');
            const confirmBtn = within(dialog).getByRole('button', { name: 'Delete' });
            await user.click(confirmBtn);

            // Dialog should close
            await waitFor(() => {
                expect(screen.queryByText('Delete Selected Books?')).not.toBeInTheDocument();
            });
        });

        it('supports deleting all books and canceling', async () => {
            mockLibrarySections({
                current: [{ id: 1, title: 'Test Book 1', authorName: 'Author 1', coverUrl: 'http://example.com/cover1.jpg', readingProgress: 0, pageCount: 300, completed: false, user: { id: 1 } }],
            });
            const user = userEvent.setup();
            render(<LibraryPage />, { wrapper: createTestWrapper() });

            await screen.findByAltText('Test Book 1');

            const delAllBtn = await screen.findByText('Delete All');
            await user.click(delAllBtn);

            expect(await screen.findByText('Delete ALL Books?')).toBeInTheDocument();

            // Cancel
            const cancelBtn = await screen.findByText('Cancel');
            await user.click(cancelBtn);

            await waitFor(() => {
                expect(screen.queryByText('Delete ALL Books?')).not.toBeInTheDocument();
            });

            // Re-open and confirm
            await user.click(delAllBtn);
            expect(await screen.findByText('Delete ALL Books?')).toBeInTheDocument();

            const dialog = screen.getByRole('alertdialog');
            const confirmBtn = within(dialog).getByRole('button', { name: 'Delete All' });
            await user.click(confirmBtn);

            await waitFor(() => {
                expect(screen.queryByText('Delete ALL Books?')).not.toBeInTheDocument();
            });
        });
    });

    describe('Section Pagination', () => {
        it('shows independent pagination for each populated section', async () => {
            server.use(
                http.get('/api/books/sections/:section', ({ params, request }) => {
                    const page = Number(new URL(request.url).searchParams.get('page') || '0');
                    const data = {
                        current: [
                            {
                                ...createSectionPage([
                                    { id: 5, title: 'Current 5', currentPage: 50, completed: false, user: { id: 1 } },
                                    { id: 4, title: 'Current 4', currentPage: 40, completed: false, user: { id: 1 } },
                                    { id: 3, title: 'Current 3', currentPage: 30, completed: false, user: { id: 1 } },
                                    { id: 2, title: 'Current 2', currentPage: 20, completed: false, user: { id: 1 } },
                                ]),
                                totalPages: 2,
                                totalElements: 5,
                            },
                            { ...createSectionPage([{ id: 1, title: 'Current 1', currentPage: 10, completed: false, user: { id: 1 } }]), totalPages: 2, totalElements: 5, number: 1 },
                        ],
                        next: [
                            {
                                ...createSectionPage([
                                    { id: 6, title: 'Next 1', currentPage: 0, completed: false, user: { id: 1 } },
                                    { id: 7, title: 'Next 2', currentPage: 0, completed: false, user: { id: 1 } },
                                    { id: 8, title: 'Next 3', currentPage: 0, completed: false, user: { id: 1 } },
                                    { id: 9, title: 'Next 4', currentPage: 0, completed: false, user: { id: 1 } },
                                ]),
                                totalPages: 2,
                                totalElements: 5,
                            },
                            { ...createSectionPage([{ id: 10, title: 'Next 5', currentPage: 0, completed: false, user: { id: 1 } }]), totalPages: 2, totalElements: 5, number: 1 },
                        ],
                    };

                    const section = String(params.section);
                    const sectionPages = data[section];
                    return HttpResponse.json(sectionPages ? sectionPages[page] : createSectionPage([]));
                })
            );

            render(<LibraryPage />, { wrapper: createTestWrapper() });

            expect((await screen.findAllByText('Current 5')).length).toBeGreaterThan(0);
            expect(screen.getAllByText('Next 1')).not.toHaveLength(0);
            expect(screen.getAllByText('1 / 2')).toHaveLength(2);
            expect(screen.queryAllByText('Next 5')).toHaveLength(0);
            expect(screen.getByLabelText('Previous page for Current Reads')).toBeDisabled();
            expect(screen.getByLabelText('Previous page for Waiting for You')).toBeDisabled();
        });

        it('keeps section pagination visible even when there is only one page', async () => {
            mockLibrarySections({ next: [{ id: 1, title: 'B1' }] });

            render(<LibraryPage />, { wrapper: createTestWrapper() });

            await screen.findByText('1 / 1');
            expect(screen.getByLabelText('Previous page for Waiting for You')).toBeDisabled();
            expect(screen.getByLabelText('Next page for Waiting for You')).toBeDisabled();
        });
    });
});
