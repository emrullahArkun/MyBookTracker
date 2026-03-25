import { useState, useRef } from 'react';
import { FaPen, FaBook, FaSearch, FaPlus, FaSpinner, FaBookOpen } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAnimation } from '../../../context/AnimationContext';
import { useAddBookToLibrary } from '../../books/hooks/useAddBookToLibrary';
import BookCover from '../../../ui/BookCover';
import styles from './DiscoverySection.module.css';

// Map icon type to component
const ICONS = {
    author: FaPen,
    category: FaBook,
    search: FaSearch,
};

/**
 * A section displaying book recommendations with title and subtitle
 */
const DiscoverySection = ({
    title,
    subtitle,
    iconType = 'author',
    books = [],
    emptyMessage
}) => {
    const Icon = ICONS[iconType] || FaBook;
    const addBookMutation = useAddBookToLibrary();

    if (!books || books.length === 0) {
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
                    <DiscoveryBookCard key={book.isbn || index} book={book} onAdd={addBookMutation.mutateAsync} />
                ))}
            </div>
        </div>
    );
};

/**
 * Individual book card with add-to-library functionality
 */
const DiscoveryBookCard = ({ book, onAdd }) => {
    const [isAdding, setIsAdding] = useState(false);
    const imageRef = useRef(null);
    const { t } = useTranslation();
    const { flyBook } = useAnimation();

    const handleAddClick = async (e) => {
        e.stopPropagation();
        if (isAdding) return;

        // Start animation
        if (imageRef.current) {
            flyBook(imageRef.current.getBoundingClientRect(), book.coverUrl);
        }

        setIsAdding(true);
        try {
            await onAdd(book);
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
                    handleAddClick(e);
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
                        imageLinks: book.coverUrl ? { thumbnail: book.coverUrl } : undefined
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
                {Array.isArray(book.authors) ? book.authors[0] : book.authors || t('discovery.unknownAuthor')}
            </p>
        </div>
    );
};

export default DiscoverySection;
