import apiClient from '../../../shared/api/apiClient';
import type {
    Book,
    BookFocusResponse,
    CreateLibraryBookPayload,
    LibrarySectionKey,
    PaginatedResponse,
    UpdateBookGoalRequest,
    UpdateBookProgressRequest,
    UpdateBookStatusRequest,
} from '../../../shared/types/books';

export const booksApi = {
    getAll: (page = 0, size = 12) => apiClient.get<PaginatedResponse<Book>>(`/api/books?page=${page}&size=${size}`),
    getSection: (section: LibrarySectionKey, page = 0, size = 4) =>
        apiClient.get<PaginatedResponse<Book>>(`/api/books/sections/${section}?page=${page}&size=${size}`),
    getFocus: (queueSize = 3) => apiClient.get<BookFocusResponse>(`/api/books/focus?queueSize=${queueSize}`),
    getOwnedIsbns: () => apiClient.get<string[]>('/api/books/owned'),
    getWithGoals: () => apiClient.get<Book[]>('/api/books/with-goals'),
    getById: (id: number) => apiClient.get<Book>(`/api/books/${id}`),
    create: (bookData: CreateLibraryBookPayload) => apiClient.post<Book, CreateLibraryBookPayload>('/api/books', bookData),
    delete: (id: number) => apiClient.delete<null>(`/api/books/${id}`),
    deleteAll: () => apiClient.delete<null>('/api/books'),
    updateProgress: (id: number, currentPage: number) =>
        apiClient.patch<Book, UpdateBookProgressRequest>(`/api/books/${id}/progress`, { currentPage }),
    updateStatus: (id: number, completed: boolean) =>
        apiClient.patch<Book, UpdateBookStatusRequest>(`/api/books/${id}/status`, { completed }),
    updateGoal: (id: number, type: UpdateBookGoalRequest['type'], pages: number) =>
        apiClient.patch<Book, UpdateBookGoalRequest>(`/api/books/${id}/goal`, { type, pages }),
};
