import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readingSessionBooksApi } from './readingSessionBooksApi';
import apiClient from '../../../shared/api/apiClient';

vi.mock('../../../shared/api/apiClient', () => ({
    default: {
        get: vi.fn(),
    },
}));

describe('readingSessionBooksApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('loads a book by id', async () => {
        const book = { id: 7, title: 'Test Book' };
        apiClient.get.mockResolvedValue(book);

        const result = await readingSessionBooksApi.getById(7);

        expect(apiClient.get).toHaveBeenCalledWith('/api/books/7');
        expect(result).toEqual(book);
    });
});
