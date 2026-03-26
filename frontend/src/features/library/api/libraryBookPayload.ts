import { getOpenLibraryCoverUrl } from '../../../shared/lib/coverUtils';
import type { CreateLibraryBookPayload, LibraryBookSource } from '../../../shared/types/books';

export const buildLibraryBookPayload = (book: LibraryBookSource): CreateLibraryBookPayload => {
    const isbn = book.isbn || null;
    const coverUrl = book.coverUrl || (isbn ? getOpenLibraryCoverUrl(isbn) : '');

    const categories = Array.isArray(book.categories)
        ? book.categories
        : (book.categories ? [book.categories] : []);

    return {
        title: book.title,
        isbn,
        authorName: Array.isArray(book.authors) ? book.authors[0] : (book.authors || 'Unknown Author'),
        publishYear: book.publishYear || null,
        coverUrl,
        pageCount: book.pageCount || 0,
        categories,
    };
};
