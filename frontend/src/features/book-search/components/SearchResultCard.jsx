import { useState, useRef } from 'react';
import { FaPlus, FaSpinner } from 'react-icons/fa';

import styles from './SearchResultCard.module.css';
import { useAnimation } from '../../../context/AnimationContext';
import BookCover from '../../../ui/BookCover';

const SearchResultCard = ({ book, onAdd }) => {
    const [isAdding, setIsAdding] = useState(false);

    const { flyBook } = useAnimation();
    const imageRef = useRef(null);

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
        </div>
    );
};

export default SearchResultCard;
