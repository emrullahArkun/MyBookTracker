import apiClient from '../../../shared/api/apiClient';
import type { Book } from '../../../shared/types/books';

export const readingSessionBooksApi = {
    getById: (bookId: number) => apiClient.get<Book>(`/api/books/${bookId}`),
};
