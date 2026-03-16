import { useEffect, useState, useRef } from 'react';
import { FaTrash, FaTrashAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useMyBooks } from './hooks/useMyBooks';
import { usePinstripeBackground } from '../../shared/hooks/usePinstripeBackground';
import ConfirmDialog from '../../shared/components/ConfirmDialog';

import MyBookCard from './components/MyBookCard';
import {
    Flex,
    Button,
    Center,
    Text,
    HStack,
    Box,
    IconButton,
    useToast,
    useDisclosure,
} from '@chakra-ui/react';

function MyBooks() {
    const { t } = useTranslation();
    const containerRef = useRef(null);

    const [dynamicPageSize, setDynamicPageSize] = useState(12);

    const {
        books,
        loading,
        error,
        selectedBooks,
        toggleSelection,
        deleteBook,
        deleteSelected,
        deleteAll,
        updateBookProgress,
        page,
        setPage,
        totalPages,
        deleteError
    } = useMyBooks(dynamicPageSize);

    const toast = useToast();

    // Dialog States
    const { isOpen: isDeleteOpen, onClose: onDeleteClose } = useDisclosure();
    const { isOpen: isDeleteAllOpen, onOpen: onDeleteAllOpen, onClose: onDeleteAllClose } = useDisclosure();
    const { isOpen: isDeleteSelectedOpen, onOpen: onDeleteSelectedOpen, onClose: onDeleteSelectedClose } = useDisclosure();

    const [bookToDelete, setBookToDelete] = useState(null);

    useEffect(() => {
        if (deleteError) {
            toast({
                title: t('myBooks.error', { message: deleteError.message }),
                status: 'error',
                duration: 5000,
                isClosable: true
            });
        }
    }, [deleteError, toast, t]);

    const confirmDelete = () => {
        if (bookToDelete) {
            deleteBook(bookToDelete);
            setBookToDelete(null);
            onDeleteClose();
        }
    };

    const confirmDeleteSelected = () => {
        deleteSelected();
        onDeleteSelectedClose();
    };

    const confirmDeleteAll = () => {
        deleteAll();
        onDeleteAllClose();
    };

    usePinstripeBackground();

    // Dynamic Page Size Calculation
    useEffect(() => {
        const calculatePageSize = () => {
            const width = window.innerWidth;
            const padding = width >= 768 ? 64 : 32;
            const scrollbarBuffer = 20;
            const availableWidth = width - padding - scrollbarBuffer;
            const cardWidth = 200;
            const gap = 24;
            const itemWidth = cardWidth + gap;

            let columns = Math.floor((availableWidth + gap) / itemWidth);
            if (width < 480) {
                columns = 2;
            } else if (columns < 1) {
                columns = 1;
            }

            const newPageSize = columns * 3;
            setDynamicPageSize(prev => prev !== newPageSize ? newPageSize : prev);
        };

        calculatePageSize();

        let timeoutId;
        const debouncedResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(calculatePageSize, 150);
        };

        window.addEventListener('resize', debouncedResize);
        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener('resize', debouncedResize);
        };
    }, []);

    if (loading && page === 0 && books.length === 0) return <Center h="200px" color="white">{t('myBooks.loading')}</Center>;
    if (error) return <Center h="200px" color="red.300">{t('myBooks.error', { message: error })}</Center>;

    return (
        <Box w="100%" px={{ base: 4, md: 8 }} py={6} ref={containerRef} minH="calc(100vh - 80px)">
            {/* Actions */}
            <Flex justify="flex-end" align="center" mb={6} wrap="wrap" gap={3}>
                {selectedBooks.size > 0 && (
                    <Button
                        size="sm"
                        leftIcon={<FaTrash />}
                        onClick={onDeleteSelectedOpen}
                        bg="whiteAlpha.100"
                        color="red.300"
                        border="1px solid"
                        borderColor="red.800"
                        _hover={{ bg: 'red.900', borderColor: 'red.700' }}
                        _active={{ bg: 'red.800' }}
                    >
                        {t('myBooks.deleteSelectedCount', { count: selectedBooks.size })}
                    </Button>
                )}
                <Button
                    size="sm"
                    leftIcon={<FaTrashAlt />}
                    onClick={onDeleteAllOpen}
                    bg="whiteAlpha.100"
                    color="gray.300"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    _hover={{ color: 'red.300', bg: 'whiteAlpha.200', borderColor: 'red.800' }}
                    _active={{ bg: 'whiteAlpha.300' }}
                >
                    {t('myBooks.deleteAll')}
                </Button>
            </Flex>

            {books.length === 0 ? (
                <Center flexDirection="column" py={16} color="gray.400">
                    <Text fontSize="lg" mb={1}>{t('myBooks.empty.line1')}</Text>
                    <Text fontSize="sm" color="gray.500">{t('myBooks.empty.line2')}</Text>
                </Center>
            ) : (
                <>
                    <Flex wrap="wrap" gap={6} justify="flex-start" alignContent="flex-start">
                        {books.map(book => (
                            <Box key={book.id} w={{ base: "calc(50% - 12px)", sm: "200px" }} flexShrink={0}>
                                <MyBookCard
                                    book={book}
                                    isSelected={selectedBooks.has(book.id)}
                                    onToggleSelect={toggleSelection}
                                    onUpdateProgress={updateBookProgress}
                                />
                            </Box>
                        ))}
                    </Flex>

                    {totalPages > 1 && (
                        <Flex justify="center" align="center" mt={10} gap={4}>
                            <IconButton
                                icon={<FaChevronLeft />}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                isDisabled={page === 0}
                                color="white"
                                variant="ghost"
                                fontSize="lg"
                                aria-label="Previous Page"
                                _hover={{ bg: 'whiteAlpha.100' }}
                            />
                            <Text color="gray.500" fontSize="sm">
                                {page + 1} / {totalPages}
                            </Text>
                            <IconButton
                                icon={<FaChevronRight />}
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                isDisabled={page >= totalPages - 1}
                                color="white"
                                variant="ghost"
                                fontSize="lg"
                                aria-label="Next Page"
                                _hover={{ bg: 'whiteAlpha.100' }}
                            />
                        </Flex>
                    )}

                    <ConfirmDialog
                        isOpen={isDeleteOpen}
                        onClose={onDeleteClose}
                        onConfirm={confirmDelete}
                        title={t('myBooks.confirmDeleteTitle', 'Delete Book?')}
                        body={t('myBooks.confirmDelete')}
                        confirmLabel={t('common.delete')}
                        cancelLabel={t('common.cancel')}
                    />

                    <ConfirmDialog
                        isOpen={isDeleteSelectedOpen}
                        onClose={onDeleteSelectedClose}
                        onConfirm={confirmDeleteSelected}
                        title={t('myBooks.confirmDeleteSelectedTitle', 'Delete Selected Books?')}
                        body={t('myBooks.confirmDeleteSelected', { count: selectedBooks.size })}
                        confirmLabel={t('common.delete')}
                        cancelLabel={t('common.cancel')}
                    />

                    <ConfirmDialog
                        isOpen={isDeleteAllOpen}
                        onClose={onDeleteAllClose}
                        onConfirm={confirmDeleteAll}
                        title={t('myBooks.confirmDeleteAllTitle', 'Delete ALL Books?')}
                        body={t('myBooks.confirmDeleteAll')}
                        confirmLabel={t('common.deleteAll')}
                        cancelLabel={t('common.cancel')}
                    />
                </>
            )}
        </Box>
    );
}

export default MyBooks;
