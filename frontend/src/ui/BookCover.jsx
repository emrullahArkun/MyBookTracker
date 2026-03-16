import { useState, useEffect, forwardRef } from 'react';
import { Image, Center, Skeleton, Box } from '@chakra-ui/react';
import { getHighResImage } from '../utils/googleBooks';

const BookCover = forwardRef(({
    book,
    objectFit = "cover",
    borderRadius = "md",
    w = "100%",
    h = "100%",
    ...props
}, ref) => {


    // Normalized info access
    // BookSearch uses book.volumeInfo, MyBooks uses top-level fields
    const info = book.volumeInfo || book;
    const initialThumb = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || info.coverUrl;
    const title = info.title;

    // Determine fallback URL from ISBN immediately
    let fallbackUrl = '';
    const identifiers = info.industryIdentifiers || [];
    let isbn = info.isbn; // MyBooks might have it top-level

    if (!isbn && identifiers.length > 0) {
        const isbn13 = identifiers.find(id => id.type === 'ISBN_13');
        const isbn10 = identifiers.find(id => id.type === 'ISBN_10');
        if (isbn13) isbn = isbn13.identifier;
        else if (isbn10) isbn = isbn10.identifier;
    }

    if (isbn && !isbn.startsWith('ID:')) {
        const cleanIsbn = isbn.replace(/-/g, '');
        if (cleanIsbn.length >= 10) {
            fallbackUrl = `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-L.jpg`;
        }
    }

    // Heuristic: If Google says "readingModes.image: false", the cover is likely a placeholder
    const googleSaysNoImage = info.readingModes?.image === false;

    // Skip Google URL entirely if Google says no image
    const googleUrl = (!googleSaysNoImage && initialThumb) ? getHighResImage(initialThumb) : '';

    // Determine the URL to use
    let safeUrl = '';
    if (googleUrl && !googleSaysNoImage) {
        safeUrl = googleUrl;
    } else if (fallbackUrl) {
        safeUrl = fallbackUrl;
    }
    // If neither works, safeUrl stays empty and we show title/author fallback

    const [imgSrc, setImgSrc] = useState(safeUrl);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Reset when book changes
    useEffect(() => {
        let newSafeUrl = '';
        if (googleUrl && !googleSaysNoImage) {
            newSafeUrl = googleUrl;
        } else if (fallbackUrl) {
            newSafeUrl = fallbackUrl;
        }
        setImgSrc(newSafeUrl);
        setImageLoaded(false);
    }, [googleSaysNoImage, googleUrl, fallbackUrl]);

    const handleImageError = () => {
        if (imgSrc === fallbackUrl) {
            // OpenLibrary failed - clear imgSrc to show text fallback
            setImgSrc(''); // Show title/author fallback
        } else {
            // Google failed. Try OpenLibrary.
            if (fallbackUrl && imgSrc !== fallbackUrl) {
                setImgSrc(fallbackUrl);
            } else {
                setImgSrc(''); // Show title/author fallback
            }
        }
        setImageLoaded(true);
    };

    const handleLoad = (e) => {
        // OpenLibrary returns a tiny 1x1 pixel image when no cover exists
        const img = e.target;
        if (img.naturalWidth < 10 || img.naturalHeight < 10) {
            // Treat as invalid - try next fallback or show text
            handleImageError();
            return;
        }
        setImageLoaded(true);
    };

    // Extract author info
    const authors = info.authors || info.authorName;
    const authorText = Array.isArray(authors) ? authors[0] : authors;

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
                ref={ref}
                src={imgSrc}
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
