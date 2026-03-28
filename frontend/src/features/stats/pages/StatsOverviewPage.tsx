import { Box, SimpleGrid, Grid, GridItem, Card, Text, Flex, Skeleton, Heading } from '@chakra-ui/react';
import { FaBook, FaBookOpen, FaCalendarCheck, FaClock, FaFire } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../../auth/model';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';
import StatsCard from '../../../shared/ui/StatsCard';
import ReadingHeatmap from '../ui/ReadingHeatmap';
import WeeklyPaceChart from '../ui/WeeklyPaceChart';
import statsApi from '../api/statsApi';
import type { DailyActivity, StatsOverview } from '../../../shared/types/stats';

const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getStartOfWeek = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfWeek = start.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + mondayOffset);
    start.setHours(0, 0, 0, 0);
    return start;
};

const formatShortDate = (dateString: string, language: string) => (
    new Date(dateString).toLocaleDateString(language, { day: 'numeric', month: 'short' })
);

const StatsOverviewPage = () => {
    const { t, i18n } = useTranslation();
    const { cardBg, textColor, subTextColor, mutedTextColor, brandColor, borderColor, subtleBorderColor, panelInsetBg, panelShadow } = useThemeTokens();
    const { token, user } = useAuth();

    const { data: stats, isLoading: loading, isError, refetch } = useQuery<StatsOverview | null>({
        queryKey: ['stats', user?.email, 'overview'],
        queryFn: () => statsApi.getOverview(),
        enabled: !!token,
    });

    if (loading) {
        return (
            <Box px={{ base: 4, md: 8 }} py={8} maxW="1180px" mx="auto">
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                    {[0, 1, 2, 3].map((i) => (
                        <Card key={i} bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow={panelShadow} p={5}>
                            <Flex align="center" mb={3} gap={3}>
                                <Skeleton w={8} h={8} borderRadius="md" startColor="rgba(248, 236, 214, 0.05)" endColor="rgba(248, 236, 214, 0.1)" />
                                <Skeleton h={3} w="60%" startColor="rgba(248, 236, 214, 0.05)" endColor="rgba(248, 236, 214, 0.1)" borderRadius="sm" />
                            </Flex>
                            <Skeleton h={8} w="50%" mb={2} startColor="rgba(248, 236, 214, 0.05)" endColor="rgba(248, 236, 214, 0.1)" borderRadius="sm" />
                            <Skeleton h={3} w="70%" startColor="rgba(248, 236, 214, 0.05)" endColor="rgba(248, 236, 214, 0.1)" borderRadius="sm" />
                        </Card>
                    ))}
                </SimpleGrid>
                <Card bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow={panelShadow} p={5} mb={6}>
                    <Skeleton h={3} w="120px" mb={4} startColor="rgba(248, 236, 214, 0.05)" endColor="rgba(248, 236, 214, 0.1)" borderRadius="sm" />
                    <Skeleton h="130px" w="100%" startColor="rgba(248, 236, 214, 0.05)" endColor="rgba(248, 236, 214, 0.1)" borderRadius="md" />
                </Card>
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                    {[0, 1].map((i) => (
                        <GridItem key={i}>
                            <Card bg={cardBg} borderRadius="xl" border="1px solid" borderColor={borderColor} boxShadow={panelShadow} p={5}>
                                <Skeleton h={3} w="120px" mb={4} startColor="rgba(248, 236, 214, 0.05)" endColor="rgba(248, 236, 214, 0.1)" borderRadius="sm" />
                                <Skeleton h="160px" w="100%" startColor="rgba(248, 236, 214, 0.05)" endColor="rgba(248, 236, 214, 0.1)" borderRadius="md" />
                            </Card>
                        </GridItem>
                    ))}
                </Grid>
            </Box>
        );
    }

    if (isError) {
        return (
            <Flex direction="column" align="center" justify="center" h="calc(100vh - 80px)" gap={4}>
                <Text color={subTextColor}>{t('stats.error')}</Text>
                <Box
                    as="button"
                    px={5}
                    py={2}
                    bg={brandColor}
                    color="#1c140e"
                    borderRadius="md"
                    fontWeight="600"
                    _hover={{ opacity: 0.92 }}
                    onClick={() => refetch()}
                >
                    {t('discovery.retry')}
                </Box>
            </Flex>
        );
    }

    if (!stats) return null;

    const today = new Date();
    const startOfWeek = getStartOfWeek(today);
    const dailyActivity = stats.dailyActivity || [];

    const thisWeekEntries = dailyActivity.filter((entry) => new Date(entry.date) >= startOfWeek);
    const readingDaysThisWeek = thisWeekEntries.filter((entry) => entry.pagesRead > 0).length;
    const pagesThisWeek = thisWeekEntries.reduce((sum, entry) => sum + entry.pagesRead, 0);
    const averageReadingDay = readingDaysThisWeek > 0
        ? Math.round(pagesThisWeek / readingDaysThisWeek)
        : 0;

    const bestRecentDay = dailyActivity.reduce<DailyActivity | null>((best, entry) => {
        if (entry.pagesRead <= 0) {
            return best;
        }

        if (!best || entry.pagesRead > best.pagesRead) {
            return entry;
        }

        return best;
    }, null);

    const completedRatio = stats.totalBooks > 0
        ? Math.round((stats.completedBooks / stats.totalBooks) * 100)
        : 0;
    const panelStyles = {
        bg: cardBg,
        border: '1px solid',
        borderColor,
        borderRadius: '2xl',
        boxShadow: panelShadow,
    };

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
                <StatsCard
                    icon={FaCalendarCheck}
                    label={t('stats.readingDaysWeek')}
                    value={readingDaysThisWeek}
                    subLabel={t('stats.readingDaysWeekHint')}
                    color="teal.200"
                    delay={0}
                    bg={cardBg}
                    textColor={textColor}
                />
                <StatsCard
                    icon={FaBookOpen}
                    label={t('stats.pagesWeek')}
                    value={pagesThisWeek.toLocaleString()}
                    subLabel={t('stats.pagesWeekHint')}
                    color="blue.200"
                    delay={0}
                    bg={cardBg}
                    textColor={textColor}
                />
                <StatsCard
                    icon={FaClock}
                    label={t('stats.averageDay')}
                    value={averageReadingDay}
                    subLabel={t('stats.averageDayHint')}
                    color="orange.200"
                    delay={0}
                    bg={cardBg}
                    textColor={textColor}
                />
                <StatsCard
                    icon={FaFire}
                    label={t('stats.streak')}
                    value={stats.currentStreak}
                    subLabel={t('stats.streakBest', { best: stats.longestStreak })}
                    color="red.300"
                    delay={0}
                    bg={cardBg}
                    textColor={textColor}
                />
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
                <StatsCard
                    icon={FaBook}
                    label={t('stats.books')}
                    value={stats.completedBooks}
                    subLabel={t('stats.booksOf', { total: stats.totalBooks })}
                    color="teal.200"
                    delay={0}
                    bg={cardBg}
                    textColor={textColor}
                />
                <StatsCard
                    icon={FaBookOpen}
                    label={t('stats.pages')}
                    value={stats.totalPagesRead.toLocaleString()}
                    subLabel={t('stats.pagesRead')}
                    color="blue.200"
                    delay={0}
                    bg={cardBg}
                    textColor={textColor}
                />
                <StatsCard
                    icon={FaClock}
                    label={t('stats.time')}
                    value={formatTime(stats.totalReadingMinutes)}
                    subLabel={t('stats.timeSpent')}
                    color="orange.200"
                    delay={0}
                    bg={cardBg}
                    textColor={textColor}
                />
                <StatsCard
                    icon={FaFire}
                    label={t('stats.totalRhythm')}
                    value={stats.longestStreak}
                    subLabel={t('stats.totalRhythmHint')}
                    color="red.300"
                    delay={0}
                    bg={cardBg}
                    textColor={textColor}
                />
            </SimpleGrid>
        </Box>
    );
};

export default StatsOverviewPage;
