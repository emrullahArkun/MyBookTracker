export type RecommendedBook = {
    title: string;
    authors: string[];
    categories: string[];
    publishYear: number | null;
    pageCount: number | null;
    isbn: string | null;
    coverUrl: string | null;
};

export type DiscoveryAuthorSection = {
    authors: string[];
    books: RecommendedBook[];
};

export type DiscoveryCategorySection = {
    categories: string[];
    books: RecommendedBook[];
};

export type DiscoverySearchSection = {
    queries: string[];
    books: RecommendedBook[];
};

export type DiscoveryResponse = {
    byAuthor: DiscoveryAuthorSection;
    byCategory: DiscoveryCategorySection;
    bySearch: DiscoverySearchSection;
};

export type DiscoverySearchResult = {
    items: RecommendedBook[];
    totalItems: number;
};
