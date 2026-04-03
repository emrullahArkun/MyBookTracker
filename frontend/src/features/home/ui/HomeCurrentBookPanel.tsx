import { Link as RouterLink } from 'react-router-dom';
import {
    Badge,
    Box,
    Button,
    Flex,
    Grid,
    Heading,
    Progress,
    SimpleGrid,
    Stack,
    Text,
} from '@chakra-ui/react';
import { FaBookOpen, FaCompass } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../app/router/routes';
import BookCover from '../../../shared/ui/BookCover';

interface CurrentBook {
    id: number;
    title: string;
    authorName: string;
    currentPage?: number | null;
    pageCount?: number | null;
}

interface HomeCurrentBookPanelProps {
    currentBook: CurrentBook | null;
    activeSession: unknown;
    activeBooksCount: number;
    activeGoalCount: number;
    completedBooksCount: number;
    panelStyles: Record<string, unknown>;
    insetStyles: Record<string, unknown>;
    brandColor: string;
    textColor: string;
    subTextColor: string;
    mutedTextColor: string;
    subtleBorderColor: string;
}

const HomeCurrentBookPanel = ({
    currentBook,
    activeSession,
    activeBooksCount,
    activeGoalCount,
    completedBooksCount,
    panelStyles,
    insetStyles,
    brandColor,
    textColor,
    subTextColor,
    mutedTextColor,
    subtleBorderColor,
}: HomeCurrentBookPanelProps) => {
    const { t } = useTranslation();

    const progressPercent = currentBook && currentBook.pageCount
        ? Math.round(((currentBook.currentPage || 0) / currentBook.pageCount) * 100)
        : 0;

    const currentBookSessionRoute = currentBook ? ROUTES.BOOK_SESSION(currentBook.id) : null;

    return (
        <Box {...panelStyles} p={{ base: 5, md: 7 }} minH="100%">
            <Stack spacing={6}>
                <Flex
                    justify="space-between"
                    gap={4}
                    align={{ base: 'flex-start', md: 'center' }}
                    direction={{ base: 'column', md: 'row' }}
                    pb={4}
                    borderBottom="1px solid"
                    borderColor={subtleBorderColor}
                >
                    <Box>
                        <Badge bg="rgba(197, 154, 92, 0.12)" color={brandColor}>
                            {activeSession ? t('home.currentSessionLabel') : t('home.currentBookLabel')}
                        </Badge>
                        <Heading color={textColor} fontSize={{ base: '2rem', md: '2.5rem' }} mt={4} mb={2}>
                            {t('home.focusTitle')}
                        </Heading>
                        <Text color={subTextColor} maxW="34rem" lineHeight="1.8" fontSize="sm">
                            {t('home.focusSubtitle')}
                        </Text>
                    </Box>
                    <Text color={mutedTextColor} fontSize="xs" textTransform="uppercase" letterSpacing="0.16em">
                        {t('home.journalLabel')}
                    </Text>
                </Flex>

                {currentBook ? (
                    <Grid
                        templateColumns={{ base: '1fr', md: '156px 1fr' }}
                        gap={{ base: 5, md: 6 }}
                        alignItems="start"
                    >
                        <Box {...insetStyles} p={3} w={{ base: '100%', md: '156px' }}>
                            <Box
                                w="100%"
                                h={{ base: '220px', md: '228px' }}
                                borderRadius="md"
                                overflow="hidden"
                                boxShadow="0 14px 24px rgba(8, 6, 4, 0.22)"
                            >
                                <BookCover book={currentBook} w="100%" h="100%" borderRadius="md" />
                            </Box>
                        </Box>
                        <Stack spacing={4} flex="1">
                            <Box pb={4} borderBottom="1px solid" borderColor={subtleBorderColor}>
                                <Text fontSize="0.68rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" mb={2}>
                                    {t('home.focusBookLabel')}
                                </Text>
                                <Heading fontSize={{ base: '1.8rem', md: '2.35rem' }} color={textColor} mb={1}>
                                    {currentBook.title}
                                </Heading>
                                <Text color={subTextColor} fontSize="md">{currentBook.authorName}</Text>
                            </Box>

                            <Box {...insetStyles} p={4}>
                                <Flex justify="space-between" mb={2} color={subTextColor} fontSize="sm" align="center">
                                    <Text textTransform="uppercase" letterSpacing="0.14em" fontSize="0.68rem" color={mutedTextColor}>
                                        {t('home.progressLabel')}
                                    </Text>
                                    <Text>
                                        {currentBook.currentPage || 0}
                                        {currentBook.pageCount ? ` / ${currentBook.pageCount}` : ''}
                                    </Text>
                                </Flex>
                                <Progress
                                    value={progressPercent}
                                    size="sm"
                                    borderRadius="full"
                                    bg="rgba(248, 236, 214, 0.08)"
                                />
                            </Box>

                            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                                <Box {...insetStyles} p={3}>
                                    <Text fontSize="0.66rem" textTransform="uppercase" letterSpacing="0.14em" color={mutedTextColor} mb={1}>
                                        {t('home.activeBooks')}
                                    </Text>
                                    <Text fontSize="2xl" fontFamily="heading" color={textColor}>
                                        {activeBooksCount}
                                    </Text>
                                </Box>
                                <Box {...insetStyles} p={3}>
                                    <Text fontSize="0.66rem" textTransform="uppercase" letterSpacing="0.14em" color={mutedTextColor} mb={1}>
                                        {t('home.activeGoals')}
                                    </Text>
                                    <Text fontSize="2xl" fontFamily="heading" color={brandColor}>
                                        {activeGoalCount}
                                    </Text>
                                </Box>
                                <Box {...insetStyles} p={3}>
                                    <Text fontSize="0.66rem" textTransform="uppercase" letterSpacing="0.14em" color={mutedTextColor} mb={1}>
                                        {t('home.completedBooks')}
                                    </Text>
                                    <Text fontSize="2xl" fontFamily="heading" color="#95a17f">
                                        {completedBooksCount}
                                    </Text>
                                </Box>
                            </SimpleGrid>

                            <Flex wrap="wrap" gap={3} pt={1}>
                                {currentBookSessionRoute && (
                                    <Button
                                        as={RouterLink}
                                        to={currentBookSessionRoute}
                                        leftIcon={<FaBookOpen />}
                                        size="sm"
                                    >
                                        {activeSession ? t('home.resumeSession') : t('home.startSession')}
                                    </Button>
                                )}
                                <Button
                                    as={RouterLink}
                                    to={ROUTES.MY_BOOKS}
                                    variant="outline"
                                    size="sm"
                                >
                                    {t('home.openLibrary')}
                                </Button>
                            </Flex>
                        </Stack>
                    </Grid>
                ) : (
                    <Box {...insetStyles} p={5}>
                        <Heading size="md" color={textColor} mb={2}>
                            {t('home.noCurrentBook')}
                        </Heading>
                        <Text color={subTextColor} mb={4} fontSize="sm">
                            {t('home.noCurrentBookHint')}
                        </Text>
                        <Flex wrap="wrap" gap={3}>
                            <Button as={RouterLink} to={ROUTES.SEARCH} leftIcon={<FaCompass />} size="sm">
                                {t('home.findBook')}
                            </Button>
                            <Button as={RouterLink} to={ROUTES.MY_BOOKS} variant="outline" size="sm">
                                {t('home.openLibrary')}
                            </Button>
                        </Flex>
                    </Box>
                )}
            </Stack>
        </Box>
    );
};

export default HomeCurrentBookPanel;
