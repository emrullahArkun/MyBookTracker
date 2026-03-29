import { useState, useEffect, useRef, useCallback, useMemo, forwardRef, type SyntheticEvent } from 'react';
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
        extraLarge?: string;
        large?: string;
        medium?: string;
        small?: string;
        thumbnail?: string;
        smallThumbnail?: string;
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
    const primaryUrl = info.coverUrl || getBestImageLink(info.imageLinks) || '';
    const identifiers = info.industryIdentifiers || [];
    let isbn = info.isbn;

    if (!isbn && identifiers.length > 0) {
        const isbn13 = identifiers.find((id) => id.type === 'ISBN_13');
        const isbn10 = identifiers.find((id) => id.type === 'ISBN_10');
        if (isbn13) isbn = isbn13.identifier;
        else if (isbn10) isbn = isbn10.identifier;
    }

    const openLibraryUrl = isbn ? getOpenLibraryCoverUrl(isbn, 'L') : '';
    const googleFallbackUrl = getGoogleBooksFallbackUrl(primaryUrl);
    const coverSources = useMemo(
        () => getCoverSources(primaryUrl, googleFallbackUrl, openLibraryUrl),
        [primaryUrl, googleFallbackUrl, openLibraryUrl],
    );
    const safeUrl = coverSources[0] || '';

    const [imgSrc, setImgSrc] = useState(safeUrl);
    const [imageLoaded, setImageLoaded] = useState(false);
    const prevUrlRef = useRef(safeUrl);
    const coverSourcesKey = useMemo(() => coverSources.join('|'), [coverSources]);
    const prevCoverSourcesKeyRef = useRef(coverSourcesKey);

    useEffect(() => {
        if (coverSourcesKey !== prevCoverSourcesKeyRef.current) {
            prevCoverSourcesKeyRef.current = coverSourcesKey;
            prevUrlRef.current = safeUrl;
            setImgSrc(safeUrl);
            setImageLoaded(false);
        }
    }, [coverSourcesKey, safeUrl]);

    const handleImageError = () => {
        const currentIndex = coverSources.indexOf(imgSrc);
        const nextSrc = currentIndex >= 0 ? coverSources[currentIndex + 1] : '';

        if (nextSrc) {
            setImgSrc(nextSrc);
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

const getBestImageLink = (imageLinks?: BookCoverInfo['imageLinks']): string => {
    if (!imageLinks) return '';

    const rawUrl = imageLinks.extraLarge
        || imageLinks.large
        || imageLinks.medium
        || imageLinks.small
        || imageLinks.thumbnail
        || imageLinks.smallThumbnail
        || '';

    return enhanceGoogleBooksImageUrl(rawUrl);
};

const enhanceGoogleBooksImageUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '';

    const normalizedUrl = rawUrl.replace('http://', 'https://');
    if (!normalizedUrl.includes('books.google') || !normalizedUrl.includes('?')) {
        return normalizedUrl;
    }

    try {
        const url = new URL(normalizedUrl);
        const currentZoom = Number(url.searchParams.get('zoom') || '0');
        if (!Number.isFinite(currentZoom) || currentZoom < 3) {
            url.searchParams.set('zoom', '3');
        }
        return url.toString();
    } catch {
        return normalizedUrl;
    }
};

const getGoogleBooksFallbackUrl = (rawUrl?: string): string => {
    if (!rawUrl) return '';

    const normalizedUrl = rawUrl.replace('http://', 'https://');
    if (!normalizedUrl.includes('books.google') || !normalizedUrl.includes('?')) {
        return '';
    }

    try {
        const url = new URL(normalizedUrl);
        const currentZoom = Number(url.searchParams.get('zoom') || '0');
        if (!Number.isFinite(currentZoom) || currentZoom <= 1) {
            return '';
        }

        url.searchParams.set('zoom', '1');
        const fallbackUrl = url.toString();
        return fallbackUrl === normalizedUrl ? '' : fallbackUrl;
    } catch {
        return '';
    }
};

const getCoverSources = (primaryUrl: string, googleFallbackUrl: string, openLibraryUrl: string): string[] => {
    if (shouldPreferOpenLibraryCover(primaryUrl, openLibraryUrl)) {
        const orderedSources = [openLibraryUrl, primaryUrl, googleFallbackUrl];
        return [...new Set(orderedSources.filter(Boolean))];
    }

    const orderedSources = [primaryUrl, googleFallbackUrl, openLibraryUrl];

    return [...new Set(orderedSources.filter(Boolean))];
};

const shouldPreferOpenLibraryCover = (primaryUrl: string, openLibraryUrl: string): boolean => {
    return Boolean(openLibraryUrl) && isSmallGoogleBooksThumbnailUrl(primaryUrl);
};

const isGoogleBooksThumbnailUrl = (url?: string): boolean => {
    if (!url) return false;

    return url.includes('books.google') && url.includes('/books/content');
};

const isSmallGoogleBooksThumbnailUrl = (url?: string): boolean => {
    if (!isGoogleBooksThumbnailUrl(url)) {
        return false;
    }

    try {
        const parsedUrl = new URL(url);
        const zoom = parsedUrl.searchParams.get('zoom');
        if (!zoom) {
            return false;
        }

        const zoomLevel = Number(zoom);
        return Number.isFinite(zoomLevel) && zoomLevel <= 3;
    } catch {
        return url?.includes('zoom=') ?? false;
    }
};
