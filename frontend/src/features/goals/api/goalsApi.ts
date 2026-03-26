import apiClient from '../../../shared/api/apiClient';
import type { Book } from '../../../shared/types/books';
import type { Streak } from '../../../shared/types/stats';

export const goalsApi = {
    getBooks: () => apiClient.get<Book[]>('/api/books/with-goals'),
    getStreak: () => apiClient.get<Streak>('/api/stats/streak'),
};
