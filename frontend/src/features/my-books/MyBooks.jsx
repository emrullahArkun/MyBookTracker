import { useEffect } from 'react';
import { FaTrash, FaTrashAlt, FaChevronLeft, FaChevronRight, FaSearch } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useMyBooks } from './hooks/useMyBooks';
import ConfirmDialog from '../../shared/components/ConfirmDialog';

import MyBookCard from './components/MyBookCard';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../app/routes';
import {
    Flex,
    Button,
    Center,
    Text,
    Box,
    Icon,
    IconButton,
    useToast,
    useDisclosure,
} from '@chakra-ui/react';

function MyBooks() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const {
        books,
        loading,
        error,
        selectedBooks,
        toggleSelection,
        deleteSelected,
        deleteAll,
        updateBookProgress,
        page,
        setPage,
        totalPages,
        deleteError
    } = useMyBooks();

    const toast = useToast();

    // Dialog States
    const { isOpen: isDeleteAllOpen, onOpen: onDeleteAllOpen, onClose: onDeleteAllClose } = useDisclosure();
    const { isOpen: isDeleteSelectedOpen, onOpen: onDeleteSelectedOpen, onClose: onDeleteSelectedClose } = useDisclosure();

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

    const confirmDeleteSelected = () => {
        deleteSelected();
        onDeleteSelectedClose();
    };

    const confirmDeleteAll = () => {
        deleteAll();
        onDeleteAllClose();
    };

    if (loading && page === 0 && books.length === 0) return <Center h="200px" color="white">{t('myBooks.loading')}</Center>;
    if (error) return <Center h="200px" color="red.300">{t('myBooks.error', { message: error })}</Center>;

    return (
        <Box w="100%" px={{ base: 4, md: 8 }} py={6} minH="calc(100vh - 80px)">
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
                <Center flexDirection="column" py={16}>
                    <Box
                        textAlign="center"
                        py={12}
                        px={8}
                        bg="whiteAlpha.50"
                        borderRadius="2xl"
                        border="1px dashed"
                        borderColor="whiteAlpha.200"
                        maxW="400px"
                    >
                        <Icon as={FaSearch} color="gray.400" boxSize={10} mb={4} />
                        <Text color="gray.300" fontSize="lg" mb={2}>{t('myBooks.empty.line1')}</Text>
                        <Text color="gray.400" fontSize="sm" mb={5}>{t('myBooks.empty.line2')}</Text>
                        <Button
                            size="sm"
                            colorScheme="teal"
                            variant="outline"
                            onClick={() => navigate(ROUTES.SEARCH)}
                        >
                            {t('search.button')}
                        </Button>
                    </Box>
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
                        isOpen={isDeleteSelectedOpen}
                        onClose={onDeleteSelectedClose}
                        onConfirm={confirmDeleteSelected}
                        title={t('myBooks.confirmDeleteSelectedTitle')}
                        body={t('myBooks.confirmDeleteSelected', { count: selectedBooks.size })}
                        confirmLabel={t('common.delete')}
                        cancelLabel={t('common.cancel')}
                    />

                    <ConfirmDialog
                        isOpen={isDeleteAllOpen}
                        onClose={onDeleteAllClose}
                        onConfirm={confirmDeleteAll}
                        title={t('myBooks.confirmDeleteAllTitle')}
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
