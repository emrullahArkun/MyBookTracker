import { useState, useEffect, useRef, useCallback, forwardRef, type SyntheticEvent } from 'react';
import { Image, Center, Skeleton, Box, type ImageProps } from '@chakra-ui/react';
import { getOpenLibraryCoverUrl } from '../lib/coverUtils';

type IndustryIdentifier = {
    type: string;
    identifier: string;
};

type BookCoverInfo = {
    title?: string;
    coverUrl?: string | null;
    isbn?: string | null;
    authors?: string[] | string | null;
    authorName?: string[] | string | null;
    industryIdentifiers?: IndustryIdentifier[];
    imageLinks?: {
        thumbnail?: string;
    };
};

type BookCoverBook = BookCoverInfo & {
    volumeInfo?: BookCoverInfo;
};

type BookCoverProps = {
    book: BookCoverBook;
    objectFit?: ImageProps['objectFit'];
    borderRadius?: ImageProps['borderRadius'];
    w?: ImageProps['w'];
    h?: ImageProps['h'];
} & Omit<ImageProps, 'src' | 'alt' | 'onLoad' | 'onError'>;

const BookCover = forwardRef<HTMLImageElement, BookCoverProps>(({
    book,
    objectFit = 'cover',
    borderRadius = 'md',
    w = '100%',
    h = '100%',
    ...props
}, ref) => {
    const info = book.volumeInfo || book;
    const title = info.title;
    const primaryUrl = info.coverUrl || '';

    let fallbackUrl = '';
    const identifiers = info.industryIdentifiers || [];
    let isbn = info.isbn;

    if (!isbn && identifiers.length > 0) {
        const isbn13 = identifiers.find((id) => id.type === 'ISBN_13');
        const isbn10 = identifiers.find((id) => id.type === 'ISBN_10');
        if (isbn13) isbn = isbn13.identifier;
        else if (isbn10) isbn = isbn10.identifier;
    }

    if (isbn) {
        fallbackUrl = getOpenLibraryCoverUrl(isbn);
    }

    const safeUrl = primaryUrl || fallbackUrl;

    const [imgSrc, setImgSrc] = useState(safeUrl);
    const [imageLoaded, setImageLoaded] = useState(false);
    const prevUrlRef = useRef(safeUrl);

    useEffect(() => {
        const newSafeUrl = primaryUrl || fallbackUrl;
        if (newSafeUrl !== prevUrlRef.current) {
            prevUrlRef.current = newSafeUrl;
            setImgSrc(newSafeUrl);
            setImageLoaded(false);
        }
    }, [primaryUrl, fallbackUrl]);

    const handleImageError = () => {
        if (imgSrc !== fallbackUrl && fallbackUrl) {
            setImgSrc(fallbackUrl);
        } else {
            setImgSrc('');
        }
        setImageLoaded(true);
    };

    const handleLoad = (e: SyntheticEvent<HTMLImageElement>) => {
        const img = e.target as HTMLImageElement;
        if (img.naturalWidth < 10 || img.naturalHeight < 10) {
            handleImageError();
            return;
        }
        setImageLoaded(true);
    };

    const authors = info.authors || info.authorName;
    const authorText = Array.isArray(authors) ? authors[0] : authors;

    const imgRef = useRef<HTMLImageElement | null>(null);
    const setRefs = useCallback((node: HTMLImageElement | null) => {
        imgRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
        if (node?.complete && node.naturalWidth > 0) {
            setImageLoaded(true);
        }
    }, [ref]);

    if (!imgSrc) {
        return (
            <Center
                w={w}
                h={h}
                borderRadius={borderRadius}
                {...props}
                bg="linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 100%)"
                color="white"
                flexDirection="column"
                p={3}
                textAlign="center"
            >
                <Box
                    fontSize={['xs', 'sm', 'md']}
                    fontWeight="bold"
                    mb={authorText ? 1 : 0}
                    noOfLines={3}
                    lineHeight="1.3"
                >
                    {title || 'Unbekannter Titel'}
                </Box>
                {authorText && (
                    <Box
                        fontSize={['2xs', 'xs', 'sm']}
                        color="gray.400"
                        noOfLines={2}
                    >
                        {authorText}
                    </Box>
                )}
            </Center>
        );
    }

    return (
        <Skeleton isLoaded={imageLoaded} w={w} h={h} borderRadius={borderRadius}>
            <Image
                ref={setRefs}
                src={imgSrc}
                loading="lazy"
                onLoad={handleLoad}
                onError={handleImageError}
                alt={title}
                w={w}
                h={h}
                objectFit={objectFit}
                borderRadius={borderRadius}
                {...props}
            />
        </Skeleton>
    );
});

BookCover.displayName = 'BookCover';

export default BookCover;
