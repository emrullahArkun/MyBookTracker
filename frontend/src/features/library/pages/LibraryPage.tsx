import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Flex, Center, Box, Stack, Text, Heading, SimpleGrid, useToast, useDisclosure,
} from '@chakra-ui/react';
import { useLibrarySections } from '../model/useLibrarySections';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import MyBookCard from '../ui/MyBookCard';
import LibraryActionsBar from '../ui/LibraryActionsBar';
import LibraryEmptyState from '../ui/LibraryEmptyState';
import LibraryPagination from '../ui/LibraryPagination';
import { createAppToast } from '../../../shared/ui/AppToast';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

function LibraryPage() {
    const { t } = useTranslation();
    const { cardBg, textColor, subTextColor, mutedTextColor, brandColor, borderColor, panelShadow } = useThemeTokens();
    const {
        loading, error, sections, totalBooks, selectedBooks, toggleSelection,
        deleteSelected, deleteAll, deleteError, clearDeleteError,
        goToPreviousPage, goToNextPage,
    } = useLibrarySections();

    const toast = useToast();
    const { isOpen: isDeleteAllOpen, onOpen: onDeleteAllOpen, onClose: onDeleteAllClose } = useDisclosure();
    const { isOpen: isDeleteSelectedOpen, onOpen: onDeleteSelectedOpen, onClose: onDeleteSelectedClose } = useDisclosure();

    useEffect(() => {
        if (deleteError) {
            toast(createAppToast({ title: t('myBooks.error', { message: deleteError.message }), status: 'error', duration: 5000 }));
            clearDeleteError();
        }
    }, [clearDeleteError, deleteError, toast, t]);

    const panelStyles = { bg: cardBg, border: '1px solid', borderColor, borderRadius: '2xl', boxShadow: panelShadow };
    const [currentSection, nextSection, finishedSection] = sections;

    if (loading && totalBooks === 0) {
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
                {[
                    { label: t('myBooks.sections.current'), value: currentSection.totalBooks, color: textColor },
                    { label: t('myBooks.sections.next'), value: nextSection.totalBooks, color: brandColor },
                    { label: t('myBooks.sections.finished'), value: finishedSection.totalBooks, color: '#95a17f' },
                    { label: t('myBooks.selected'), value: selectedBooks.size, color: textColor },
                ].map(({ label, value, color }) => (
                    <Box key={label} {...panelStyles} p={4}>
                        <Text fontSize="0.66rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.14em" mb={1}>{label}</Text>
                        <Text fontSize="2xl" fontFamily="heading" color={color}>{value}</Text>
                    </Box>
                ))}
            </SimpleGrid>

            {totalBooks > 0 && (
                <Flex align="center" justify="flex-end" mb={6} gap={4} minH="40px">
                    <LibraryActionsBar selectedCount={selectedBooks.size} onDeleteSelected={onDeleteSelectedOpen} onDeleteAll={onDeleteAllOpen} />
                </Flex>
            )}

            {totalBooks === 0 ? (
                <LibraryEmptyState />
            ) : (
                <>
                    <Stack spacing={10}>
                        {sections.map((section) => {
                            if (section.totalBooks === 0) return null;
                            return (
                                <Box key={section.key} {...panelStyles} p={{ base: 4, md: 5 }}>
                                    <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" mb={5} gap={3} pb={4} borderBottom="1px solid" borderColor="rgba(217, 188, 146, 0.1)" direction={{ base: 'column', md: 'row' }}>
                                        <Box>
                                            <Flex align="baseline" gap={2} mb={1}>
                                                <Text fontSize="lg" fontWeight="600" color={textColor} fontFamily="heading">{section.title}</Text>
                                                <Text fontSize="xs" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.12em">{section.totalBooks}</Text>
                                            </Flex>
                                            <Text color={subTextColor} fontSize="sm">{section.hint}</Text>
                                        </Box>
                                        <LibraryPagination
                                            page={section.page}
                                            totalPages={section.totalPages}
                                            contextLabel={section.title}
                                            onPreviousPage={() => goToPreviousPage(section.key)}
                                            onNextPage={() => goToNextPage(section.key, section.totalPages)}
                                        />
                                    </Flex>
                                    <Flex wrap="wrap" gap={5} justify="flex-start" alignContent="flex-start">
                                        {section.books.map((book) => (
                                            <Box key={book.id} w={{ base: 'calc(50% - 10px)', sm: '208px' }} flexShrink={0}>
                                                <MyBookCard book={book} isSelected={selectedBooks.has(book.id)} onToggleSelect={toggleSelection} />
                                            </Box>
                                        ))}
                                    </Flex>
                                </Box>
                            );
                        })}
                    </Stack>

                    <ConfirmDialog isOpen={isDeleteSelectedOpen} onClose={onDeleteSelectedClose} onConfirm={() => { deleteSelected(); onDeleteSelectedClose(); }}
                        title={t('myBooks.confirmDeleteSelectedTitle')} body={t('myBooks.confirmDeleteSelected', { count: selectedBooks.size })}
                        confirmLabel={t('common.delete')} cancelLabel={t('common.cancel')} />
                    <ConfirmDialog isOpen={isDeleteAllOpen} onClose={onDeleteAllClose} onConfirm={() => { deleteAll(); onDeleteAllClose(); }}
                        title={t('myBooks.confirmDeleteAllTitle')} body={t('myBooks.confirmDeleteAll')}
                        confirmLabel={t('common.deleteAll')} cancelLabel={t('common.cancel')} />
                </>
            )}
        </Box>
    );
}

export default LibraryPage;
