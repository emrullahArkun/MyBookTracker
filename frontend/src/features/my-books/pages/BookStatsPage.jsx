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
} from '@chakra-ui/react';
import { useBookStats } from '../hooks/useBookStats';
import { useBookStatsCalculations } from '../hooks/useBookStatsCalculations';
import { useBookGoalEditor } from '../hooks/useBookGoalEditor';

import { useThemeTokens } from '../../../shared/hooks/useThemeTokens';
import { FaBookOpen, FaChartLine, FaClock } from 'react-icons/fa';

import StatsCard from '../components/StatsCard';
import BookGoalModal from '../components/BookGoalModal';
import BookStatsSidebar from '../components/BookStatsSidebar';
import BookStatsCharts from '../components/BookStatsCharts';
import NoSessionsModal from '../components/NoSessionsModal';
import PageErrorState from '../../../shared/components/PageErrorState';

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

    const { bgColor, cardBg, textColor, subTextColor, brandColor } = useThemeTokens();

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
        <Box bg={bgColor} h="calc(100vh - 60px)" px={{ base: 4, md: 8 }} pt={5} pb={5} w="100%" overflow="hidden" display="flex" flexDirection="column">
            <Box w="100%" flex="1" minH="0">

                <Grid templateColumns={{ base: "1fr", lg: "280px 1fr" }} gap={6} alignItems="start" w="100%" h="full">
                    {/* Left Sidebar: Detailed Book Info */}
                    <GridItem h="full" overflow="auto" css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                        <BookStatsSidebar
                            book={book}
                            stats={stats}
                            goalProgress={goalProgress}
                            onOpenModal={onOpen}
                            cardBg={cardBg}
                            textColor={textColor}
                            subTextColor={subTextColor}
                        />
                    </GridItem>

                    {/* Right Content: Dashboard */}
                    <GridItem w="full" h="full" display="flex" flexDirection="column" overflow="hidden">
                        <VStack spacing={5} align="stretch" w="full" h="full" overflow="hidden">
                            {/* KPI Cards */}
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} flexShrink={0}>
                                <StatsCard
                                    icon={FaClock}
                                    label={t('bookStats.totalTime.label')}
                                    value={hasSessions ? (stats?.totalTime || '-') : '-'}
                                    subLabel={t('bookStats.totalTime.subLabel')}
                                    color="teal.200"
                                    delay={0.1}
                                    bg={cardBg}
                                    textColor={textColor}
                                />
                                <StatsCard
                                    icon={FaBookOpen}
                                    label={t('bookStats.speed.label')}
                                    value={hasSessions ? (stats?.speed || '-') : '-'}
                                    subLabel={t('bookStats.speed.subLabel')}
                                    color="blue.200"
                                    delay={0.2}
                                    bg={cardBg}
                                    textColor={textColor}
                                />
                                {!book.completed && (
                                    <StatsCard
                                        icon={FaChartLine}
                                        label={t('bookStats.projection.label')}
                                        value={hasSessions ? `~${stats?.timeLeft || '-'}` : '-'}
                                        subLabel={t('bookStats.projection.subLabel')}
                                        color="purple.200"
                                        delay={0.3}
                                        bg={cardBg}
                                        textColor={textColor}
                                    />
                                )}
                            </SimpleGrid>

                            {/* Main Chart */}
                            {stats && (
                                <BookStatsCharts
                                    stats={stats}
                                    sessions={sessions}
                                    bookId={id}
                                    cardBg={cardBg}
                                    textColor={textColor}
                                    subTextColor={subTextColor}
                                />
                            )}
                        </VStack>
                    </GridItem>
                </Grid>
            </Box>

            <NoSessionsModal isOpen={!hasSessions && !!book} bookId={id} />

            {/* Set Goal Modal */}
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
