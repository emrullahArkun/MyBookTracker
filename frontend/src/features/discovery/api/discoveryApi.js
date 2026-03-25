import apiClient from '../../../api/apiClient';

/**
 * Discovery API client
 */
const discoveryApi = {
    /**
     * Get all discovery data (authors, categories, recent searches)
     */
    getAll: () => apiClient.get('/api/discovery'),

    /**
     * Get recommendations by top authors
     */
    getByAuthors: () => apiClient.get('/api/discovery/authors'),

    /**
     * Get recommendations by top categories
     */
    getByCategories: () => apiClient.get('/api/discovery/categories'),

    /**
     * Get recommendations by recent searches
     */
    getByRecentSearches: () => apiClient.get('/api/discovery/recent-searches'),

    /**
     * Search books via backend
     */
    search: (query, startIndex = 0, maxResults = 36) =>
        apiClient.get(`/api/discovery/search?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${maxResults}`),

    /**
     * Log a search query
     */
    logSearch: (query) => apiClient.post('/api/discovery/search-log', { query }),
};

export default discoveryApi;
