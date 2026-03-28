import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Grid,
    GridItem,
    SimpleGrid,
    useDisclosure,
    Spinner,
    Flex,
    VStack,
    Text,
    Heading,
} from '@chakra-ui/react';
import { useBookStats } from '../model/useBookStats';
import { useBookStatsCalculations } from '../model/useBookStatsCalculations';
import { useBookGoalEditor } from '../model/useBookGoalEditor';

import { useThemeTokens } from '../../../shared/theme/useThemeTokens';
import { FaBookOpen, FaChartLine, FaClock } from 'react-icons/fa';

import StatsCard from '../../../shared/ui/StatsCard';
import BookGoalModal from '../ui/BookGoalModal';
import BookStatsSidebar from '../ui/BookStatsSidebar';
import BookStatsCharts from '../ui/BookStatsCharts';
import NoSessionsModal from '../ui/NoSessionsModal';
import PageErrorState from '../../../shared/ui/PageErrorState';

const BookStatsPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const { book, sessions, loading, error, refetch } = useBookStats(id);
    const { stats, goalProgress } = useBookStatsCalculations(book, sessions);
    const {
        goalType,
        setGoalType,
        goalPages,
        setGoalPages,
        isSavingGoal,
        handleSaveGoal,
    } = useBookGoalEditor({ book, bookId: id, refetch, onClose });

    const { bgColor, cardBg, textColor, subTextColor, mutedTextColor, brandColor, borderColor, panelShadow } = useThemeTokens();

    const hasSessions = sessions.length > 0;

    if (loading) return (
        <Flex justify="center" align="center" h="100vh" bg={bgColor}>
            <Spinner size="xl" color={brandColor} thickness="4px" />
        </Flex>
    );

    if (error) {
        return (
            <PageErrorState
                title={t('myBooks.error', { message: error.message || error })}
                onRetry={refetch}
                retryLabel={t('discovery.retry')}
            />
        );
    }

    if (!book) return <Box textAlign="center" py={20} color={textColor}>{t('bookStats.notFound')}</Box>;

    return (
        <Box bg={bgColor} px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }} maxW="1280px" mx="auto" w="100%">
            <Box mb={8}>
                <Text fontSize="0.7rem" fontWeight="700" color={brandColor} textTransform="uppercase" letterSpacing="0.16em" mb={3}>
                    {t('bookStats.badge')}
                </Text>
                <Heading fontSize={{ base: '2.35rem', md: '3rem' }} lineHeight="0.96" color={textColor} mb={2}>
                    {book.title}
                </Heading>
                <Text color={subTextColor} fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.8" maxW="60ch">
                    {book.authorName}
                </Text>
            </Box>

            <Grid templateColumns={{ base: "1fr", lg: "300px 1fr" }} gap={6} alignItems="stretch" w="100%">
                <GridItem h="full" overflow="hidden">
                    <Box
                        bg={cardBg}
                        border="1px solid"
                        borderColor={borderColor}
                        borderRadius="2xl"
                        boxShadow={panelShadow}
                        p={1}
                    >
                        <BookStatsSidebar
                            book={book}
                            stats={stats}
                            goalProgress={goalProgress}
                            onOpenModal={onOpen}
                            textColor={textColor}
                            subTextColor={subTextColor}
                            compact
                        />
                    </Box>
                </GridItem>

                <GridItem w="full" h="full" display="flex" flexDirection="column" overflow="hidden">
                    <VStack spacing={4} align="stretch" w="full" h="full" overflow="hidden">
                        <SimpleGrid columns={{ base: 1, md: book.completed ? 2 : 3 }} spacing={4} flexShrink={0}>
                            <StatsCard
                                icon={FaClock}
                                label={t('bookStats.totalTime.label')}
                                value={hasSessions ? (stats?.totalTime || '-') : '-'}
                                subLabel={t('bookStats.totalTime.subLabel')}
                                color="#d9bc92"
                                delay={0}
                                bg={cardBg}
                                textColor={textColor}
                                compact
                            />
                            <StatsCard
                                icon={FaBookOpen}
                                label={t('bookStats.speed.label')}
                                value={hasSessions ? (stats?.speed || '-') : '-'}
                                subLabel={t('bookStats.speed.subLabel')}
                                color="#95a17f"
                                delay={0}
                                bg={cardBg}
                                textColor={textColor}
                                compact
                            />
                            {!book.completed && (
                                <StatsCard
                                    icon={FaChartLine}
                                    label={t('bookStats.projection.label')}
                                    value={hasSessions ? `~${stats?.timeLeft || '-'}` : '-'}
                                    subLabel={t('bookStats.projection.subLabel')}
                                    color="#f4ead7"
                                    delay={0}
                                    bg={cardBg}
                                    textColor={textColor}
                                    compact
                                />
                            )}
                        </SimpleGrid>

                        {stats && (
                            <BookStatsCharts
                                stats={stats}
                                sessions={sessions}
                                bookId={id}
                                cardBg={cardBg}
                                textColor={textColor}
                                subTextColor={subTextColor}
                                mutedTextColor={mutedTextColor}
                                borderColor={borderColor}
                            />
                        )}
                    </VStack>
                </GridItem>
            </Grid>

            <NoSessionsModal isOpen={!hasSessions && !!book} bookId={id} />
            <BookGoalModal
                isOpen={isOpen}
                onClose={onClose}
                goalType={goalType}
                setGoalType={setGoalType}
                goalPages={goalPages}
                setGoalPages={setGoalPages}
                handleSaveGoal={handleSaveGoal}
                isSavingGoal={isSavingGoal}
            />
        </Box>
    );
};

export default BookStatsPage;
