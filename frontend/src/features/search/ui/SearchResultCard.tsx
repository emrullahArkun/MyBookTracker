import { useState, useRef, type MouseEvent, type KeyboardEvent } from 'react';
import { FaPlus, FaSpinner } from 'react-icons/fa';

import styles from './SearchResultCard.module.css';
import { useAnimation } from '../../../app/providers/AnimationProvider';
import BookCover from '../../../shared/ui/BookCover';
import type { LibraryBookSource } from '../../../shared/types/books';

type SearchResultCardProps = {
    book: LibraryBookSource & { authors?: string[] | string | null; coverUrl?: string | null; title: string };
    onAdd: (book: SearchResultCardProps['book']) => Promise<unknown>;
};

const SearchResultCard = ({ book, onAdd }: SearchResultCardProps) => {
    const [isAdding, setIsAdding] = useState(false);

    const { flyBook } = useAnimation();
    const imageRef = useRef<HTMLImageElement | null>(null);
    const author = Array.isArray(book.authors) ? book.authors[0] : book.authors;

    const handleAddClick = async (e: MouseEvent | KeyboardEvent) => {
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
            className={styles.searchResultCard}
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
                    book={book}
                    className={styles.coverImage}
                    borderRadius="12px"
                    w="100%"
                    h="100%"
                />

                <div className={styles.hoverOverlay}>
                    {isAdding ? (
                        <FaSpinner className={`${styles.plusIcon} ${styles.spinning}`} />
                    ) : (
                        <FaPlus className={styles.plusIcon} />
                    )}
                </div>
            </div>
            <div className={styles.meta}>
                <p className={styles.title} title={book.title}>
                    {book.title}
                </p>
                <p className={styles.author} title={author || 'Unknown Author'}>
                    {author || 'Unknown Author'}
                </p>
            </div>
        </div>
    );
};

export default SearchResultCard;
