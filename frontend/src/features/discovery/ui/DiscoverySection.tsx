import { useState, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { FaPen, FaBook, FaSearch, FaPlus, FaSpinner, FaBookOpen } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAnimation } from '../../../app/providers/AnimationProvider';
import { useAddDiscoveryBook } from '../model/useAddDiscoveryBook';
import BookCover from '../../../shared/ui/BookCover';
import styles from './DiscoverySection.module.css';
import type { RecommendedBook } from '../../../shared/types/discovery';

type IconType = 'author' | 'category' | 'search';

type DiscoverySectionProps = {
    title: string;
    subtitle?: string;
    iconType?: IconType | string;
    books?: RecommendedBook[];
    emptyMessage: string;
};

const ICONS = {
    author: FaPen,
    category: FaBook,
    search: FaSearch,
} as const;

const DiscoverySection = ({
    title,
    subtitle,
    iconType = 'author',
    books = [],
    emptyMessage,
}: DiscoverySectionProps) => {
    const Icon = ICONS[iconType as IconType] || FaBook;
    const addBookMutation = useAddDiscoveryBook();

    if (!books.length) {
        return (
            <div className={styles.discoverySection}>
                <div className={styles.sectionHeader}>
                    <Icon className={styles.headerIcon} />
                    <h3 className={styles.sectionTitle}>{title}</h3>
                    {subtitle && <span className={styles.sectionSubtitle}>{subtitle}</span>}
                </div>
                <div className={styles.emptyState}>
                    <FaBookOpen className={styles.emptyIcon} />
                    <p>{emptyMessage}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.discoverySection}>
            <div className={styles.sectionHeader}>
                <Icon className={styles.headerIcon} />
                <h3 className={styles.sectionTitle}>{title}</h3>
                {subtitle && <span className={styles.sectionSubtitle}>{subtitle}</span>}
            </div>
            <div className={styles.booksGrid}>
                {books.map((book, index) => (
                    <DiscoveryBookCard
                        key={book.isbn || `${book.title}-${index}`}
                        book={book}
                        onAdd={addBookMutation.mutateAsync}
                    />
                ))}
            </div>
        </div>
    );
};

type DiscoveryBookCardProps = {
    book: RecommendedBook;
    onAdd: (book: RecommendedBook) => Promise<unknown>;
};

const DiscoveryBookCard = ({ book, onAdd }: DiscoveryBookCardProps) => {
    const [isAdding, setIsAdding] = useState(false);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const { t } = useTranslation();
    const { flyBook } = useAnimation();

    const handleAddClick = async (e: MouseEvent<HTMLDivElement> | KeyboardEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (isAdding) return;

        const animationPayload = imageRef.current
            ? {
                rect: imageRef.current.getBoundingClientRect(),
                coverUrl: book.coverUrl,
            }
            : null;

        setIsAdding(true);
        try {
            await onAdd(book);
            if (animationPayload?.coverUrl) {
                flyBook(animationPayload.rect, animationPayload.coverUrl);
            }
        } catch {
            // The mutation hook already handles user-facing error feedback.
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <div
            className={styles.bookCard}
            onClick={handleAddClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    void handleAddClick(e);
                }
            }}
        >
            <div className={styles.imageContainer}>
                <BookCover
                    ref={imageRef}
                    book={{
                        title: book.title,
                        isbn: book.isbn,
                        coverUrl: book.coverUrl,
                        imageLinks: book.coverUrl ? { thumbnail: book.coverUrl } : undefined,
                    }}
                    className={styles.bookCover}
                    w="100%"
                    h="100%"
                    borderRadius="8px"
                />
                <div className={styles.hoverOverlay}>
                    {isAdding ? (
                        <FaSpinner className={`${styles.plusIcon} ${styles.spinning}`} />
                    ) : (
                        <FaPlus className={styles.plusIcon} />
                    )}
                </div>
            </div>
            <p className={styles.bookTitle} title={book.title}>
                {book.title}
            </p>
            <p className={styles.bookAuthor}>
                {Array.isArray(book.authors) ? book.authors[0] : t('discovery.unknownAuthor')}
            </p>
        </div>
    );
};

export default DiscoverySection;
