import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Flex,
    Center,
    Box,
    Stack,
    Text,
    Heading,
    SimpleGrid,
    useToast,
    useDisclosure,
} from '@chakra-ui/react';
import { useMyBooks } from '../model/useMyBooks';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import MyBookCard from '../ui/MyBookCard';
import LibraryActionsBar from '../ui/LibraryActionsBar';
import LibraryEmptyState from '../ui/LibraryEmptyState';
import LibraryPagination from '../ui/LibraryPagination';
import { useReadingSessionContext } from '../../reading-session/model/ReadingSessionContext';
import type { Book } from '../../../shared/types/books';
import { createAppToast } from '../../../shared/ui/AppToast';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

type LibrarySection = {
    key: string;
    title: string;
    hint: string;
    books: Book[];
};

function LibraryPage() {
    const { t } = useTranslation();
    const {
        cardBg,
        textColor,
        subTextColor,
        mutedTextColor,
        brandColor,
        borderColor,
        panelShadow,
    } = useThemeTokens();
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
        deleteError,
    } = useMyBooks();
    const { activeSession } = useReadingSessionContext();

    const toast = useToast();
    const { isOpen: isDeleteAllOpen, onOpen: onDeleteAllOpen, onClose: onDeleteAllClose } = useDisclosure();
    const { isOpen: isDeleteSelectedOpen, onOpen: onDeleteSelectedOpen, onClose: onDeleteSelectedClose } = useDisclosure();

    const sections = useMemo<LibrarySection[]>(() => {
        const activeSessionBookId = activeSession?.bookId ?? null;

        const currentReads = [...books]
            .filter((book) => !book.completed && (book.currentPage || 0) > 0)
            .sort((a, b) => {
                if (a.id === activeSessionBookId) return -1;
                if (b.id === activeSessionBookId) return 1;
                return (b.currentPage || 0) - (a.currentPage || 0);
            });

        const upNext = [...books]
            .filter((book) => !book.completed && (book.currentPage || 0) === 0)
            .sort((a, b) => {
                const aHasGoal = a.readingGoalType ? 1 : 0;
                const bHasGoal = b.readingGoalType ? 1 : 0;
                return bHasGoal - aHasGoal;
            });

        const finished = [...books]
            .filter((book) => Boolean(book.completed))
            .sort((a, b) => (b.currentPage || 0) - (a.currentPage || 0));

        return [
            {
                key: 'current',
                title: t('myBooks.sections.current'),
                hint: activeSession
                    ? t('myBooks.sections.currentHintActive')
                    : t('myBooks.sections.currentHint'),
                books: currentReads,
            },
            {
                key: 'next',
                title: t('myBooks.sections.next'),
                hint: t('myBooks.sections.nextHint'),
                books: upNext,
            },
            {
                key: 'finished',
                title: t('myBooks.sections.finished'),
                hint: t('myBooks.sections.finishedHint'),
                books: finished,
            },
        ];
    }, [activeSession, books, t]);

    useEffect(() => {
        if (deleteError) {
            toast(createAppToast({
                title: t('myBooks.error', { message: deleteError.message }),
                status: 'error',
                duration: 5000,
            }));
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

    const totalSelected = selectedBooks.size;
    const activeCount = sections.find((section) => section.key === 'current')?.books.length ?? 0;
    const nextCount = sections.find((section) => section.key === 'next')?.books.length ?? 0;
    const finishedCount = sections.find((section) => section.key === 'finished')?.books.length ?? 0;
    const panelStyles = {
        bg: cardBg,
        border: '1px solid',
        borderColor,
        borderRadius: '2xl',
        boxShadow: panelShadow,
    };

    if (loading && page === 0 && books.length === 0) {
        return <Center h="200px" color={textColor}>{t('myBooks.loading')}</Center>;
    }

    if (error) {
        return <Center h="200px" color="#cf6d58">{t('myBooks.error', { message: error })}</Center>;
    }

    return (
        <Box px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }} maxW="1180px" mx="auto" minH="calc(100vh - 80px)">
            <Box mb={8}>
                <Text fontSize="0.7rem" fontWeight="700" color={brandColor} textTransform="uppercase" letterSpacing="0.16em" mb={3}>
                    {t('myBooks.title')}
                </Text>
                <Heading fontSize={{ base: '2.4rem', md: '3rem' }} lineHeight="0.96" color={textColor} mb={3}>
                    {t('myBooks.editorialTitle')}
                </Heading>
                <Text color={subTextColor} maxW="60ch" lineHeight="1.8" fontSize={{ base: 'md', md: 'lg' }}>
                    {t('myBooks.focusHint')}
                </Text>
            </Box>

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={6}>
                <Box {...panelStyles} p={4}>
                    <Text fontSize="0.66rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.14em" mb={1}>
                        {t('myBooks.sections.current')}
                    </Text>
                    <Text fontSize="2xl" fontFamily="heading" color={textColor}>
                        {activeCount}
                    </Text>
                </Box>
                <Box {...panelStyles} p={4}>
                    <Text fontSize="0.66rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.14em" mb={1}>
                        {t('myBooks.sections.next')}
                    </Text>
                    <Text fontSize="2xl" fontFamily="heading" color={brandColor}>
                        {nextCount}
                    </Text>
                </Box>
                <Box {...panelStyles} p={4}>
                    <Text fontSize="0.66rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.14em" mb={1}>
                        {t('myBooks.sections.finished')}
                    </Text>
                    <Text fontSize="2xl" fontFamily="heading" color="#95a17f">
                        {finishedCount}
                    </Text>
                </Box>
                <Box {...panelStyles} p={4}>
                    <Text fontSize="0.66rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.14em" mb={1}>
                        {t('myBooks.selected')}
                    </Text>
                    <Text fontSize="2xl" fontFamily="heading" color={textColor}>
                        {totalSelected}
                    </Text>
                </Box>
            </SimpleGrid>

            <Flex
                align="center"
                justify="space-between"
                mb={6}
                gap={4}
                minH="40px"
            >
                <LibraryPagination
                    page={page}
                    totalPages={totalPages}
                    onPreviousPage={() => setPage((currentPage) => Math.max(0, currentPage - 1))}
                    onNextPage={() => setPage((currentPage) => Math.min(Math.max(totalPages - 1, 0), currentPage + 1))}
                />
                {books.length > 0 && (
                    <LibraryActionsBar
                        selectedCount={selectedBooks.size}
                        onDeleteSelected={onDeleteSelectedOpen}
                        onDeleteAll={onDeleteAllOpen}
                    />
                )}
            </Flex>

            {books.length === 0 ? (
                <LibraryEmptyState />
            ) : (
                <>
                    <Stack spacing={10}>
                        {sections.map((section) => {
                            if (section.books.length === 0) {
                                return null;
                            }

                            return (
                                <Box key={section.key} {...panelStyles} p={{ base: 4, md: 5 }}>
                                    <Flex align="baseline" justify="space-between" mb={5} gap={3} pb={4} borderBottom="1px solid" borderColor="rgba(217, 188, 146, 0.1)">
                                        <Box>
                                            <Flex align="baseline" gap={2} mb={1}>
                                                <Text fontSize="lg" fontWeight="600" color={textColor} fontFamily="heading">
                                                    {section.title}
                                                </Text>
                                                <Text fontSize="xs" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.12em">
                                                    {section.books.length}
                                                </Text>
                                            </Flex>
                                            <Text color={subTextColor} fontSize="sm">
                                                {section.hint}
                                            </Text>
                                        </Box>
                                    </Flex>

                                    <Flex wrap="wrap" gap={5} justify="flex-start" alignContent="flex-start">
                                        {section.books.map((book) => (
                                            <Box key={book.id} w={{ base: 'calc(50% - 10px)', sm: '208px' }} flexShrink={0}>
                                                <MyBookCard
                                                    book={book}
                                                    isSelected={selectedBooks.has(book.id)}
                                                    onToggleSelect={toggleSelection}
                                                    onUpdateProgress={updateBookProgress}
                                                />
                                            </Box>
                                        ))}
                                    </Flex>
                                </Box>
                            );
                        })}
                    </Stack>

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

export default LibraryPage;
