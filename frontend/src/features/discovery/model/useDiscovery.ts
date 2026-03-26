import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/model';
import { discoveryApi } from '../api';
import type { DiscoveryResponse, RecommendedBook } from '../../../shared/types/discovery';

type FilteredDiscoveryData = DiscoveryResponse;

const EMPTY_DISCOVERY_DATA: FilteredDiscoveryData = {
    byAuthor: { authors: [], books: [] },
    byCategory: { categories: [], books: [] },
    bySearch: { queries: [], books: [] },
};

const filterValidBooks = (books: RecommendedBook[]): RecommendedBook[] =>
    books.filter((book) => !!book.isbn && !!book.coverUrl && book.coverUrl.trim() !== '');

const normalizeDiscoveryData = (response: DiscoveryResponse | null): FilteredDiscoveryData => {
    if (!response) {
        return EMPTY_DISCOVERY_DATA;
    }

    return {
        byAuthor: {
            authors: response.byAuthor?.authors || [],
            books: filterValidBooks(response.byAuthor?.books || []),
        },
        byCategory: {
            categories: response.byCategory?.categories || [],
            books: filterValidBooks(response.byCategory?.books || []),
        },
        bySearch: {
            queries: response.bySearch?.queries || [],
            books: filterValidBooks(response.bySearch?.books || []),
        },
    };
};

export const useDiscovery = () => {
    const { token, user } = useAuth();

    const {
        data,
        isLoading: loading,
        error,
        refetch: refresh,
    } = useQuery<FilteredDiscoveryData, Error>({
        queryKey: ['discovery', user?.email],
        queryFn: async () => {
            const response = await discoveryApi.getAll();
            return normalizeDiscoveryData(response);
        },
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
    });

    return {
        loading,
        error: error ? error.message : null,
        data: data || EMPTY_DISCOVERY_DATA,
        refresh,
    };
};

export default useDiscovery;
