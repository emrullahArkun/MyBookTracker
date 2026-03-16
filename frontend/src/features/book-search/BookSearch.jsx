import { useCallback, useRef, useState, useEffect } from 'react';
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
        loading,
        searchBooks,
        loadMore,
        addBookToLibrary,
        ownedIsbns
    } = useBookSearch();

    const gridRef = useRef(null);
    const [columns, setColumns] = useState(null);

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        const measure = () => {
            const style = window.getComputedStyle(grid);
            const cols = style.getPropertyValue('grid-template-columns').split(' ').length;
            setColumns(cols);
        };

        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(grid);
        return () => observer.disconnect();
    }, []);

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

    const hasResults = results.length > 0 || loading;

    // Trim results to fill complete rows only
    const visibleResults = columns && results.length > 0
        ? results.slice(0, Math.floor(results.length / columns) * columns)
        : results;

    return (
        <div className={styles.searchContainer}>
            <div className={`${homeStyles.heroSection} ${hasResults ? homeStyles.compact : homeStyles.centered}`}>
                <TypewriterTitle />
                <SearchForm query={query} setQuery={setQuery} onSearch={searchBooks} />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.resultsGrid} ref={gridRef}>
                {visibleResults.map((book) => (
                    <SearchResultCard
                        key={book.id}
                        book={book}
                        onAdd={handleAddBook}
                        ownedIsbns={ownedIsbns}
                    />
                ))}

                {loading && Array.from({ length: columns || 5 }).map((_, index) => (
                    <SearchResultSkeleton key={`skeleton-${index}`} />
                ))}
            </div>

            {visibleResults.length > 0 && hasMore && !loading && (
                <button onClick={loadMore} className={styles.loadMoreBtn}>{t('search.loadMore')}</button>
            )}

            {!hasMore && visibleResults.length > 0 && <div className={styles.endMessage}>{t('search.endResults')}</div>}
        </div>
    );
}

export default BookSearch;
