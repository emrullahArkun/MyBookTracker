import { useCallback } from 'react';
import styles from './BookSearch.module.css';
import homeStyles from '../../pages/HomePage.module.css';
import { useBookSearch } from './hooks/useBookSearch.jsx';
import SearchForm from './components/SearchForm';
import SearchResultCard from './components/SearchResultCard';
import SearchResultSkeleton from './components/SearchResultSkeleton';
import TypewriterTitle from '../../shared/components/TypewriterTitle';
import { useTranslation } from 'react-i18next';

function BookSearch({ onBookAdded }) {
    const { t } = useTranslation();
    const {
        query, setQuery,
        results,
        error,
        hasMore,
        isLoading,
        isFetchingNextPage,
        searchBooks,
        loadMore,
        addBookToLibrary,
    } = useBookSearch();

    const handleAddBook = useCallback(async (book) => {
        try {
            const success = await addBookToLibrary(book);
            if (success && onBookAdded) {
                onBookAdded();
            }
        } catch (error) {
            // Error is handled by global onError toast in useBookSearch
        }
    }, [addBookToLibrary, onBookAdded]);

    const hasResults = results.length > 0 || isLoading;

    return (
        <div className={styles.searchContainer}>
            <div className={`${homeStyles.heroSection} ${hasResults ? homeStyles.compact : homeStyles.centered}`}>
                <div className={`${styles.titleWrapper} ${hasResults ? styles.titleHidden : ''}`}>
                    <TypewriterTitle />
                </div>
                <SearchForm query={query} setQuery={setQuery} onSearch={searchBooks} />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.resultsGrid}>
                {results.map((book, index) => (
                    <SearchResultCard
                        key={book.isbn || `${book.title}-${index}`}
                        book={book}
                        onAdd={handleAddBook}
                    />
                ))}

                {isLoading && Array.from({ length: 5 }).map((_, index) => (
                    <SearchResultSkeleton key={`skeleton-${index}`} />
                ))}
            </div>

            {results.length > 0 && hasMore && !isFetchingNextPage && (
                <button onClick={loadMore} className={styles.loadMoreBtn}>{t('search.loadMore')}</button>
            )}

            {isFetchingNextPage && (
                <button disabled className={styles.loadMoreBtn}>{t('search.loading')}</button>
            )}

            {!hasMore && results.length > 0 && <div className={styles.endMessage}>{t('search.endResults')}</div>}
        </div>
    );
}

export default BookSearch;
