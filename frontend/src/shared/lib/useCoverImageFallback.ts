import { useState, useEffect, useRef, useMemo, type SyntheticEvent } from 'react';

export const useCoverImageFallback = (coverSources: string[]) => {
    const safeUrl = coverSources[0] || '';
    const [imgSrc, setImgSrc] = useState(safeUrl);
    const [imageLoaded, setImageLoaded] = useState(false);
    const coverSourcesKey = useMemo(() => coverSources.join('|'), [coverSources]);
    const prevCoverSourcesKeyRef = useRef(coverSourcesKey);

    useEffect(() => {
        if (coverSourcesKey !== prevCoverSourcesKeyRef.current) {
            prevCoverSourcesKeyRef.current = coverSourcesKey;
            setImgSrc(safeUrl);
            setImageLoaded(false);
        }
    }, [coverSourcesKey, safeUrl]);

    const handleImageError = () => {
        const currentIndex = coverSources.indexOf(imgSrc);
        const nextSrc = currentIndex >= 0 ? coverSources[currentIndex + 1] : '';
        setImgSrc(nextSrc || '');
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

    return { imgSrc, imageLoaded, setImageLoaded, handleLoad, handleImageError };
};
