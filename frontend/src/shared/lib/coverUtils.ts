export const getOpenLibraryCoverUrl = (isbn?: string | null): string => {
    if (!isbn || isbn.startsWith('ID:')) return '';

    const clean = isbn.replace(/-/g, '');
    return clean.length >= 10 ? `https://covers.openlibrary.org/b/isbn/${clean}-M.jpg` : '';
};
