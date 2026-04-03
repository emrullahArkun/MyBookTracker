import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { useAddBookToLibrary } from '../../library';
import type { DiscoveryResponse, RecommendedBook } from '../../../shared/types/discovery';

const removeBookFromDiscoverySection = <
    TSection extends { books?: RecommendedBook[] } | undefined
>(section: TSection, isbn: string | null) => ({
    ...section,
    books: (section?.books || []).filter((book) => book.isbn !== isbn),
});

export const useAddDiscoveryBook = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useAddBookToLibrary({
        onSuccess: (_, addedBook) => {
            queryClient.setQueryData<DiscoveryResponse | undefined>(['discovery', user?.email], (currentDiscovery) => {
                if (!currentDiscovery) {
                    return currentDiscovery;
                }

                const isbn = addedBook.isbn ?? null;
                return {
                    byAuthor: removeBookFromDiscoverySection(currentDiscovery.byAuthor, isbn),
                    byCategory: removeBookFromDiscoverySection(currentDiscovery.byCategory, isbn),
                    bySearch: removeBookFromDiscoverySection(currentDiscovery.bySearch, isbn),
                };
            });
        },
    });
};
