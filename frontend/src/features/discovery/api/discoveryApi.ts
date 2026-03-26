import apiClient from '../../../shared/api/apiClient';
import type {
    DiscoveryAuthorSection,
    DiscoveryCategorySection,
    DiscoveryResponse,
    DiscoverySearchResult,
    DiscoverySearchSection,
} from '../../../shared/types/discovery';

type SearchLogRequest = {
    query: string;
};

const discoveryApi = {
    getAll: () => apiClient.get<DiscoveryResponse>('/api/discovery'),
    getByAuthors: () => apiClient.get<DiscoveryAuthorSection>('/api/discovery/authors'),
    getByCategories: () => apiClient.get<DiscoveryCategorySection>('/api/discovery/categories'),
    getByRecentSearches: () => apiClient.get<DiscoverySearchSection>('/api/discovery/recent-searches'),
    search: (query: string, startIndex = 0, maxResults = 36) =>
        apiClient.get<DiscoverySearchResult>(
            `/api/discovery/search?q=${encodeURIComponent(query)}&startIndex=${startIndex}&maxResults=${maxResults}`
        ),
    logSearch: (query: string) => apiClient.post<null, SearchLogRequest>('/api/discovery/search-log', { query }),
};

export default discoveryApi;
