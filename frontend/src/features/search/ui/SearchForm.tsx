import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { FaHistory, FaSearch } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './SearchForm.module.css';

type SearchFormProps = {
    query: string;
    setQuery: (value: string) => void;
    onSearch: () => void;
    recentSearches: string[];
    isHistoryOpen: boolean;
    onOpenHistory: () => void;
    onCloseHistory: () => void;
    onSelectRecentSearch: (query: string) => void;
};

const SearchForm = ({
    query,
    setQuery,
    onSearch,
    recentSearches,
    isHistoryOpen,
    onOpenHistory,
    onCloseHistory,
    onSelectRecentSearch,
}: SearchFormProps) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const historyListId = useId();
    const [selectedHistoryIndex, setSelectedHistoryIndex] = useState(-1);
    const isHistoryVisible = isHistoryOpen && recentSearches.length > 0;

    const handleOpenHistory = () => {
        setSelectedHistoryIndex(-1);
        onOpenHistory();
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSearch();
    };

    const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (!isHistoryVisible) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedHistoryIndex((currentIndex) => (
                currentIndex < recentSearches.length - 1 ? currentIndex + 1 : 0
            ));
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedHistoryIndex((currentIndex) => (
                currentIndex > 0 ? currentIndex - 1 : recentSearches.length - 1
            ));
            return;
        }

        if (event.key === 'Enter' && selectedHistoryIndex >= 0) {
            event.preventDefault();
            onSelectRecentSearch(recentSearches[selectedHistoryIndex]);
        }
    };

    useEffect(() => {
        if (!isHistoryVisible) {
            setSelectedHistoryIndex(-1);
        }
    }, [isHistoryVisible]);

    useEffect(() => {
        setSelectedHistoryIndex((currentIndex) => {
            if (recentSearches.length === 0) {
                return -1;
            }

            return currentIndex >= recentSearches.length ? recentSearches.length - 1 : currentIndex;
        });
    }, [recentSearches]);

    useEffect(() => {
        if (!isHistoryOpen) {
            return undefined;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (containerRef.current?.contains(event.target as Node)) {
                return;
            }

            onCloseHistory();
        };

        const handleFocusIn = (event: FocusEvent) => {
            if (containerRef.current?.contains(event.target as Node)) {
                return;
            }

            onCloseHistory();
        };

        const handleKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === 'Escape') {
                onCloseHistory();
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('focusin', handleFocusIn);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isHistoryOpen, onCloseHistory]);

    return (
        <div className={styles.searchShell} ref={containerRef}>
            <form onSubmit={handleSubmit} className={styles.searchForm}>
                <FaSearch className={styles.searchIcon} aria-hidden="true" />
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={handleOpenHistory}
                    onKeyDown={handleInputKeyDown}
                    aria-expanded={isHistoryVisible}
                    aria-controls={isHistoryVisible ? historyListId : undefined}
                    aria-activedescendant={
                        isHistoryVisible && selectedHistoryIndex >= 0
                            ? `${historyListId}-${selectedHistoryIndex}`
                            : undefined
                    }
                    placeholder={t('search.placeholder')}
                    className={styles.searchInput}
                />
            </form>

            {isHistoryVisible && (
                <div className={styles.historyPanel}>
                    <ul id={historyListId} className={styles.historyList} aria-label={t('search.recentSearches')}>
                        {recentSearches.map((recentSearch, index) => (
                            <li key={recentSearch}>
                                <button
                                    type="button"
                                    id={`${historyListId}-${index}`}
                                    className={`${styles.historyItem} ${selectedHistoryIndex === index ? styles.historyItemActive : ''}`}
                                    aria-selected={selectedHistoryIndex === index}
                                    onClick={() => onSelectRecentSearch(recentSearch)}
                                    onMouseEnter={() => setSelectedHistoryIndex(index)}
                                >
                                    <FaHistory className={styles.historyIcon} aria-hidden="true" />
                                    <span>{recentSearch}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchForm;
