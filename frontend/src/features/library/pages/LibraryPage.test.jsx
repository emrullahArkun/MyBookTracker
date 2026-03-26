import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../auth/model/AuthContext';
import { ReadingSessionProvider } from '../../reading-session/model/ReadingSessionContext';
import LibraryPage from './LibraryPage';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';
// Mock translations
import '../../../app/i18n';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
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
                <ReadingSessionProvider>
                    <MemoryRouter>
                        {children}
                    </MemoryRouter>
                </ReadingSessionProvider>
            </QueryClientProvider>
        </AuthContext.Provider>
    );
};

describe('MyBooks Component', () => {
    beforeEach(() => {
        mockNavigate.mockClear();
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
            http.get('/api/books', () => {
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
        server.use(
            http.get('/api/books', () => {
                return HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0 });
            })
        );
        render(<LibraryPage />, { wrapper: createTestWrapper() });
        expect(await screen.findByText('No books in your library yet.')).toBeInTheDocument();
        expect(await screen.findByText('Go to search to add books!')).toBeInTheDocument();
        expect(screen.queryByText('Delete All')).not.toBeInTheDocument();
        expect(screen.getByText('1 / 1')).toBeInTheDocument();
        expect(screen.getByLabelText(/Previous Page/i)).toBeDisabled();
        expect(screen.getByLabelText(/Next Page/i)).toBeDisabled();
    });

    it('navigates to search when clicking the search button in empty state', async () => {
        const user = userEvent.setup();
        server.use(
            http.get('/api/books', () => {
                return HttpResponse.json({ content: [], totalElements: 0, totalPages: 0, number: 0 });
            })
        );
        render(<LibraryPage />, { wrapper: createTestWrapper() });
        const searchBtn = await screen.findByText('Search');
        await user.click(searchBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/search');
    });

    describe('Selection & Bulk Delete', () => {
        it('toggles selection and deletes selected books', async () => {
            server.use(
                http.get('/api/books', () => {
                    return HttpResponse.json({
                        content: [{ id: 1, title: 'Test Book 1', authorName: 'Author 1', coverUrl: 'http://example.com/cover1.jpg', readingProgress: 0, pageCount: 300, completed: false, user: { id: 1 } }],
                        totalElements: 1,
                        totalPages: 1,
                        number: 0
                    });
                })
            );
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
            server.use(
                http.get('/api/books', () => {
                    return HttpResponse.json({
                        content: [{ id: 1, title: 'Test Book 1', authorName: 'Author 1', coverUrl: 'http://example.com/cover1.jpg', readingProgress: 0, pageCount: 300, completed: false, user: { id: 1 } }],
                        totalElements: 1,
                        totalPages: 1,
                        number: 0
                    });
                })
            );
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

    describe('Pagination & Layout Resize', () => {
        it('handles window resize dynamically for pagination size', async () => {
            // Mock window innerWidth and resize event
            window.innerWidth = 400; // Force mobile
            render(<LibraryPage />, { wrapper: createTestWrapper() });

            window.dispatchEvent(new Event('resize'));

            // Wait for elements to respond (since dynamic calculations happen in effect)
            expect(await screen.findByAltText('Test Book 1')).toBeInTheDocument();

            window.innerWidth = 1200; // Desktop
            window.dispatchEvent(new Event('resize'));
        });

        it('handles very narrow window where columns would be less than 1', async () => {
            const originalInnerWidth = window.innerWidth;
            try {
                window.innerWidth = 50;
                render(<LibraryPage />, { wrapper: createTestWrapper() });
                window.dispatchEvent(new Event('resize'));
                expect(await screen.findByAltText('Test Book 1')).toBeInTheDocument();
            } finally {
                window.innerWidth = originalInnerWidth;
                window.dispatchEvent(new Event('resize'));
            }
        });

        it('shows and handles pagination buttons', async () => {
            const user = userEvent.setup();
            server.use(
                http.get('/api/books', ({ request }) => {
                    const url = new URL(request.url);
                    const page = Number(url.searchParams.get('page') || '0');
                    return HttpResponse.json({
                        content: [{ id: 1, title: 'B1' }, { id: 2, title: 'B2' }],
                        totalElements: 20,
                        totalPages: 2,
                        number: page
                    });
                })
            );

            render(<LibraryPage />, { wrapper: createTestWrapper() });

            // Next Page
            const nextBtn = await screen.findByLabelText(/Next Page/i);
            expect(nextBtn).toBeInTheDocument();
            expect(screen.getByLabelText(/Previous Page/i)).toBeDisabled();

            await user.click(nextBtn);

            // Assuming after click, we request page 1 and then prevBtn should be enabled.
            // But we didn't mock the second call, we just want to ensure click handler fires.
            await waitFor(() => {
                expect(screen.getByLabelText(/Previous Page/i)).not.toBeDisabled();
            });

            // Click Previous Page to go back
            const prevBtn = screen.getByLabelText(/Previous Page/i);
            await user.click(prevBtn);

            await waitFor(() => {
                expect(screen.getByLabelText(/Previous Page/i)).toBeDisabled();
            });
        });

        it('keeps the pagination visible even when there is only one page', async () => {
            server.use(
                http.get('/api/books', () => {
                    return HttpResponse.json({
                        content: [{ id: 1, title: 'B1' }],
                        totalElements: 1,
                        totalPages: 1,
                        number: 0
                    });
                })
            );

            render(<LibraryPage />, { wrapper: createTestWrapper() });

            await screen.findByText('1 / 1');
            expect(screen.getByLabelText(/Previous Page/i)).toBeDisabled();
            expect(screen.getByLabelText(/Next Page/i)).toBeDisabled();
        });
    });
});
