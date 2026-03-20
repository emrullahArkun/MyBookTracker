import { useState, useEffect, useRef, useCallback, forwardRef } from 'react';
import { Image, Center, Skeleton, Box } from '@chakra-ui/react';
import { getOpenLibraryCoverUrl } from '../utils/googleBooks';

const BookCover = forwardRef(({
    book,
    objectFit = "cover",
    borderRadius = "md",
    w = "100%",
    h = "100%",
    fallbackIconSize,
    ...props
}, ref) => {

    // Normalized info access
    // BookSearch uses flat fields, MyBooks uses top-level fields
    const info = book.volumeInfo || book;
    const title = info.title;

    // Primary cover URL from the book data
    const primaryUrl = info.coverUrl || '';

    // Fallback URL from ISBN via OpenLibrary
    let fallbackUrl = '';
    const identifiers = info.industryIdentifiers || [];
    let isbn = info.isbn;

    if (!isbn && identifiers.length > 0) {
        const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
        const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
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

    // Only reset when the resolved URL actually changes
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
            // Primary failed, try fallback
            setImgSrc(fallbackUrl);
        } else {
            // All sources failed, show text fallback
            setImgSrc('');
        }
        setImageLoaded(true);
    };

    const handleLoad = (e) => {
        const img = e.target;
        // OpenLibrary returns a tiny 1x1 pixel image when no cover exists
        if (img.naturalWidth < 10 || img.naturalHeight < 10) {
            handleImageError();
            return;
        }
        setImageLoaded(true);
    };

    // Extract author info
    const authors = info.authors || info.authorName;
    const authorText = Array.isArray(authors) ? authors[0] : authors;

    // Merge forwarded ref with our internal ref to detect cached images
    const imgRef = useRef(null);
    const setRefs = useCallback((node) => {
        imgRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
        // If the browser already has this image cached, skip the skeleton
        if (node?.complete && node.naturalWidth > 0) {
            setImageLoaded(true);
        }
    }, [ref]);

    // If we have no source at all after logic
    if (!imgSrc) {
        return (
            <Center
                w={w}
                h={h}
                borderRadius={borderRadius}
                {...props}
                bg="linear-gradient(145deg, #3a3a3a 0%, #1a1a1a 100%)"
                color="white"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                p={3}
                textAlign="center"
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}
            >
                <Box
                    fontSize={["xs", "sm", "md"]}
                    fontWeight="bold"
                    mb={authorText ? 1 : 0}
                    noOfLines={3}
                    lineHeight="1.3"
                >
                    {title || 'Unbekannter Titel'}
                </Box>
                {authorText && (
                    <Box
                        fontSize={["2xs", "xs", "sm"]}
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

export default BookCover;
