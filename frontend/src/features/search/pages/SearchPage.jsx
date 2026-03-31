import { useCallback } from 'react';
import styles from './SearchPage.module.css';
import { useBookSearch } from '../model/useBookSearch';
import SearchForm from '../ui/SearchForm';
import SearchResultCard from '../ui/SearchResultCard';
import SearchResultSkeleton from '../ui/SearchResultSkeleton';
import TypewriterTitle from '../../../shared/ui/TypewriterTitle';
import { useTranslation } from 'react-i18next';

/**
 * @param {{ onBookAdded?: () => void }} props
 */
function SearchPage({ onBookAdded = undefined }) {
    const { t } = useTranslation();
    const {
        query, setQuery,
        recentSearches,
        isHistoryOpen,
        results,
        error,
        hasMore,
        isLoading,
        isFetchingNextPage,
        searchBooks,
        openHistory,
        closeHistory,
        selectRecentSearch,
        loadMore,
        addBookToLibrary,
    } = useBookSearch();

    const handleAddBook = useCallback(async (book) => {
        const addedBook = await addBookToLibrary(book);
        if (addedBook && onBookAdded) {
            onBookAdded();
        }
        return addedBook;
    }, [addBookToLibrary, onBookAdded]);

    const hasResults = results.length > 0 || isLoading;

    return (
        <div className={styles.searchContainer}>
            <div className={`${styles.heroSection} ${hasResults ? styles.compact : styles.centered}`}>
                <div className={`${styles.titleWrapper} ${hasResults ? styles.titleHidden : ''}`}>
                    <TypewriterTitle />
                </div>
                <SearchForm
                    query={query}
                    setQuery={setQuery}
                    onSearch={searchBooks}
                    recentSearches={recentSearches}
                    isHistoryOpen={isHistoryOpen}
                    onOpenHistory={openHistory}
                    onCloseHistory={closeHistory}
                    onSelectRecentSearch={selectRecentSearch}
                />
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

export default SearchPage;
