import { Box, SimpleGrid, Grid, GridItem, Card, Text, Flex, Heading } from '@chakra-ui/react';
import { FaBook, FaBookOpen, FaCalendarCheck, FaClock, FaFire } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

import { useThemeTokens } from '../../../shared/theme/useThemeTokens';
import StatsCard from '../../../shared/ui/StatsCard';
import ReadingHeatmap from '../ui/ReadingHeatmap';
import WeeklyPaceChart from '../ui/WeeklyPaceChart';
import StatsOverviewSkeleton from '../ui/StatsOverviewSkeleton';
import { useStatsOverviewData, formatTime, formatShortDate } from '../model/useStatsOverviewData';

const StatsOverviewPage = () => {
    const { t, i18n } = useTranslation();
    const { cardBg, textColor, subTextColor, mutedTextColor, brandColor, borderColor, subtleBorderColor, panelInsetBg, panelShadow } = useThemeTokens();
    const { stats, loading, isError, refetch, weekStats, bestRecentDay, completedRatio } = useStatsOverviewData();

    if (loading) return <StatsOverviewSkeleton />;

    if (isError) {
        return (
            <Flex direction="column" align="center" justify="center" h="calc(100vh - 80px)" gap={4}>
                <Text color={subTextColor}>{t('stats.error')}</Text>
                <Box
                    as="button" px={5} py={2} bg={brandColor} color="#1c140e"
                    borderRadius="md" fontWeight="600" _hover={{ opacity: 0.92 }}
                    onClick={() => refetch()}
                >
                    {t('discovery.retry')}
                </Box>
            </Flex>
        );
    }

    if (!stats || !weekStats) return null;

    const panelStyles = { bg: cardBg, border: '1px solid', borderColor, borderRadius: '2xl', boxShadow: panelShadow };

    return (
        <Box px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }} maxW="1180px" mx="auto">
            <Box mb={8}>
                <Text fontSize="0.7rem" fontWeight="700" color={brandColor} textTransform="uppercase" letterSpacing="0.16em" mb={3}>
                    {t('stats.badge')}
                </Text>
                <Heading fontSize={{ base: '2.4rem', md: '3rem' }} color={textColor} lineHeight="0.96" mb={3}>
                    {t('stats.title')}
                </Heading>
                <Text color={subTextColor} maxW="58ch" lineHeight="1.8" fontSize={{ base: 'md', md: 'lg' }}>
                    {t('stats.subtitle')}
                </Text>
            </Box>

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                <StatsCard icon={FaCalendarCheck} label={t('stats.readingDaysWeek')} value={weekStats.readingDaysThisWeek}
                    subLabel={t('stats.readingDaysWeekHint')} color="teal.200" delay={0} bg={cardBg} textColor={textColor} />
                <StatsCard icon={FaBookOpen} label={t('stats.pagesWeek')} value={weekStats.pagesThisWeek.toLocaleString()}
                    subLabel={t('stats.pagesWeekHint')} color="blue.200" delay={0} bg={cardBg} textColor={textColor} />
                <StatsCard icon={FaClock} label={t('stats.averageDay')} value={weekStats.averageReadingDay}
                    subLabel={t('stats.averageDayHint')} color="orange.200" delay={0} bg={cardBg} textColor={textColor} />
                <StatsCard icon={FaFire} label={t('stats.streak')} value={stats.currentStreak}
                    subLabel={t('stats.streakBest', { best: stats.longestStreak })} color="red.300" delay={0} bg={cardBg} textColor={textColor} />
            </SimpleGrid>

            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mb={6}>
                <GridItem>
                    <Card {...panelStyles} p={5} h="full">
                        <Text fontSize="0.68rem" fontWeight="700" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" mb={3}>
                            {t('stats.bestDay.title')}
                        </Text>
                        <Text color={textColor} fontSize="3xl" fontWeight="700" lineHeight="1" mb={2} fontFamily="heading">
                            {bestRecentDay ? bestRecentDay.pagesRead.toLocaleString() : 0}
                        </Text>
                        <Text color={subTextColor} fontSize="sm" lineHeight="1.7">
                            {bestRecentDay
                                ? t('stats.bestDay.hint', { date: formatShortDate(bestRecentDay.date, i18n.language) })
                                : t('stats.bestDay.empty')}
                        </Text>
                    </Card>
                </GridItem>
                <GridItem>
                    <Card {...panelStyles} p={5} h="full">
                        <Text fontSize="0.68rem" fontWeight="700" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" mb={3}>
                            {t('stats.libraryProgress.title')}
                        </Text>
                        <Text color={textColor} fontSize="3xl" fontWeight="700" lineHeight="1" mb={2} fontFamily="heading">
                            {completedRatio}%
                        </Text>
                        <Text color={subTextColor} fontSize="sm" lineHeight="1.7">
                            {t('stats.libraryProgress.hint', { completed: stats.completedBooks, total: stats.totalBooks })}
                        </Text>
                    </Card>
                </GridItem>
            </Grid>

            <Card {...panelStyles} p={5} mb={6}>
                <Text fontSize="0.68rem" fontWeight="700" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" mb={4}>
                    {t('stats.heatmap.title')}
                </Text>
                <Box bg={panelInsetBg} border="1px solid" borderColor={subtleBorderColor} borderRadius="xl" p={{ base: 3, md: 4 }}>
                    <ReadingHeatmap dailyActivity={stats.dailyActivity} />
                </Box>
            </Card>

            <Card {...panelStyles} p={5}>
                <Text fontSize="0.68rem" fontWeight="700" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" mb={4}>
                    {t('stats.weeklyPace.title')}
                </Text>
                <Box bg={panelInsetBg} border="1px solid" borderColor={subtleBorderColor} borderRadius="xl" p={{ base: 3, md: 4 }}>
                    <WeeklyPaceChart dailyActivity={stats.dailyActivity} />
                </Box>
            </Card>

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mt={6}>
                <StatsCard icon={FaBook} label={t('stats.books')} value={stats.completedBooks}
                    subLabel={t('stats.booksOf', { total: stats.totalBooks })} color="teal.200" delay={0} bg={cardBg} textColor={textColor} />
                <StatsCard icon={FaBookOpen} label={t('stats.pages')} value={stats.totalPagesRead.toLocaleString()}
                    subLabel={t('stats.pagesRead')} color="blue.200" delay={0} bg={cardBg} textColor={textColor} />
                <StatsCard icon={FaClock} label={t('stats.time')} value={formatTime(stats.totalReadingMinutes)}
                    subLabel={t('stats.timeSpent')} color="orange.200" delay={0} bg={cardBg} textColor={textColor} />
                <StatsCard icon={FaFire} label={t('stats.totalRhythm')} value={stats.longestStreak}
                    subLabel={t('stats.totalRhythmHint')} color="red.300" delay={0} bg={cardBg} textColor={textColor} />
            </SimpleGrid>
        </Box>
    );
};

export default StatsOverviewPage;
