import { describe, it, expect, vi, beforeEach } from 'vitest';
import discoveryApi from './discoveryApi';
import apiClient from '../../../api/apiClient';

vi.mock('../../../api/apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

describe('discoveryApi', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getAll should GET /api/discovery', async () => {
        apiClient.get.mockResolvedValue({});
        await discoveryApi.getAll();
        expect(apiClient.get).toHaveBeenCalledWith('/api/discovery');
    });

    it('getByAuthors should GET authors endpoint', async () => {
        await discoveryApi.getByAuthors();
        expect(apiClient.get).toHaveBeenCalledWith('/api/discovery/authors');
    });

    it('getByCategories should GET categories endpoint', async () => {
        await discoveryApi.getByCategories();
        expect(apiClient.get).toHaveBeenCalledWith('/api/discovery/categories');
    });

    it('getByRecentSearches should GET recent-searches endpoint', async () => {
        await discoveryApi.getByRecentSearches();
        expect(apiClient.get).toHaveBeenCalledWith('/api/discovery/recent-searches');
    });

    it('search should GET search endpoint with params', async () => {
        await discoveryApi.search('test query', 0, 36);
        expect(apiClient.get).toHaveBeenCalledWith('/api/discovery/search?q=test%20query&startIndex=0&maxResults=36');
    });

    it('search should use default params', async () => {
        await discoveryApi.search('test');
        expect(apiClient.get).toHaveBeenCalledWith('/api/discovery/search?q=test&startIndex=0&maxResults=36');
    });

    it('logSearch should POST with query in body', async () => {
        await discoveryApi.logSearch('test query');
        expect(apiClient.post).toHaveBeenCalledWith('/api/discovery/search-log', { query: 'test query' });
    });

    it('logSearch should pass special characters in body', async () => {
        await discoveryApi.logSearch('C++ Bücher & co');
        expect(apiClient.post).toHaveBeenCalledWith('/api/discovery/search-log', { query: 'C++ Bücher & co' });
    });
});
