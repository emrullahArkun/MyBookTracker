import { getOpenLibraryCoverUrl } from './coverUtils';

type ImageLinks = {
    extraLarge?: string;
    large?: string;
    medium?: string;
    small?: string;
    thumbnail?: string;
    smallThumbnail?: string;
};

export const getBestImageLink = (imageLinks?: ImageLinks): string => {
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

const isSmallGoogleBooksThumbnailUrl = (url?: string): boolean => {
    if (!url || !url.includes('books.google') || !url.includes('/books/content')) {
        return false;
    }

    try {
        const parsedUrl = new URL(url);
        const zoom = parsedUrl.searchParams.get('zoom');
        if (!zoom) return false;
        const zoomLevel = Number(zoom);
        return Number.isFinite(zoomLevel) && zoomLevel <= 3;
    } catch {
        return url.includes('zoom=');
    }
};

export const buildCoverSources = (
    primaryUrl: string,
    isbn?: string | null,
): string[] => {
    const openLibraryUrl = isbn ? getOpenLibraryCoverUrl(isbn, 'L') : '';
    const googleFallbackUrl = getGoogleBooksFallbackUrl(primaryUrl);

    const preferOpenLibrary = Boolean(openLibraryUrl) && isSmallGoogleBooksThumbnailUrl(primaryUrl);
    const orderedSources = preferOpenLibrary
        ? [openLibraryUrl, primaryUrl, googleFallbackUrl]
        : [primaryUrl, googleFallbackUrl, openLibraryUrl];

    return [...new Set(orderedSources.filter(Boolean))];
};
