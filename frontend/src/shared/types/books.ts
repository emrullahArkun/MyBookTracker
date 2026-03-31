export type BookAuthorInput = string | string[] | null | undefined;
export type BookCategoryInput = string | string[] | null | undefined;

export type LibraryBookSource = {
    title: string;
    isbn?: string | null;
    coverUrl?: string | null;
    authors?: BookAuthorInput;
    publishYear?: number | null;
    pageCount?: number | null;
    categories?: BookCategoryInput;
};

export type CreateLibraryBookPayload = {
    title: string;
    isbn: string | null;
    authorName: string;
    publishYear: number | null;
    coverUrl: string;
    pageCount: number;
    categories: string[];
};

export type ReadingGoalType = 'WEEKLY' | 'MONTHLY' | null;
export type LibrarySectionKey = 'current' | 'next' | 'finished';

export type Book = {
    id: number;
    isbn: string | null;
    title: string;
    authorName: string;
    publishYear: number | null;
    coverUrl: string | null;
    pageCount: number | null;
    currentPage: number | null;
    startDate: string | null;
    completed: boolean | null;
    readingGoalType: ReadingGoalType;
    readingGoalPages: number | null;
    readingGoalProgress: number | null;
    categories: string[];
};

export type PaginatedResponse<T> = {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
};

export type BookFocusResponse = {
    currentBook: Book | null;
    queuedBooks: Book[];
    activeBooksCount: number;
    completedBooksCount: number;
};

export type UpdateBookProgressRequest = {
    currentPage: number;
};

export type UpdateBookStatusRequest = {
    completed: boolean;
};

export type UpdateBookGoalRequest = {
    type: Exclude<ReadingGoalType, null>;
    pages: number;
};
