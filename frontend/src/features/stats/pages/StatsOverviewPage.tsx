import { Box, SimpleGrid, Grid, GridItem, Card, Text, Flex, Skeleton } from '@chakra-ui/react';
import { FaBook, FaBookOpen, FaClock, FaFire } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '../../auth/model';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';
import StatsCard from '../../../shared/ui/StatsCard';
import ReadingHeatmap from '../ui/ReadingHeatmap';
import GenreDonutChart from '../ui/GenreDonutChart';
import WeeklyPaceChart from '../ui/WeeklyPaceChart';
import statsApi from '../api/statsApi';
import type { StatsOverview } from '../../../shared/types/stats';

const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const StatsOverviewPage = () => {
    const { t } = useTranslation();
    const { cardBg, textColor } = useThemeTokens();
    const { token, user } = useAuth();

    const { data: stats, isLoading: loading, isError, refetch } = useQuery<StatsOverview | null>({
        queryKey: ['stats', user?.email, 'overview'],
        queryFn: () => statsApi.getOverview(),
        enabled: !!token,
    });

    if (loading) {
        return (
            <Box px={{ base: 4, md: 10 }} py={8} maxW="1100px" mx="auto">
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                    {[0, 1, 2, 3].map((i) => (
                        <Card key={i} bg={cardBg} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" boxShadow="none" p={5}>
                            <Flex align="center" mb={3} gap={3}>
                                <Skeleton w={8} h={8} borderRadius="lg" startColor="whiteAlpha.100" endColor="whiteAlpha.200" />
                                <Skeleton h={3} w="60%" startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="md" />
                            </Flex>
                            <Skeleton h={8} w="50%" mb={2} startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="md" />
                            <Skeleton h={3} w="70%" startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="md" />
                        </Card>
                    ))}
                </SimpleGrid>
                <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" boxShadow="none" p={5} mb={6}>
                    <Skeleton h={3} w="120px" mb={4} startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="md" />
                    <Skeleton h="130px" w="100%" startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="lg" />
                </Card>
                <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                    {[0, 1].map((i) => (
                        <GridItem key={i}>
                            <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" boxShadow="none" p={5}>
                                <Skeleton h={3} w="120px" mb={4} startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="md" />
                                <Skeleton h="160px" w="100%" startColor="whiteAlpha.100" endColor="whiteAlpha.200" borderRadius="lg" />
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
                <Text color="gray.400">{t('stats.error')}</Text>
                <Box
                    as="button"
                    px={5}
                    py={2}
                    bg="teal.500"
                    color="white"
                    borderRadius="lg"
                    fontWeight="600"
                    _hover={{ bg: 'teal.400' }}
                    onClick={() => refetch()}
                >
                    {t('discovery.retry')}
                </Box>
            </Flex>
        );
    }

    if (!stats) return null;

    return (
        <Box px={{ base: 4, md: 10 }} py={8} maxW="1100px" mx="auto">
            {/* KPI Cards */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                <StatsCard icon={FaBook} label={t('stats.books')} value={stats.completedBooks}
                    subLabel={t('stats.booksOf', { total: stats.totalBooks })} color="teal.200" delay={0} bg={cardBg} textColor={textColor} />
                <StatsCard icon={FaBookOpen} label={t('stats.pages')} value={stats.totalPagesRead.toLocaleString()}
                    subLabel={t('stats.pagesRead')} color="blue.200" delay={0} bg={cardBg} textColor={textColor} />
                <StatsCard icon={FaClock} label={t('stats.time')} value={formatTime(stats.totalReadingMinutes)}
                    subLabel={t('stats.timeSpent')} color="orange.200" delay={0} bg={cardBg} textColor={textColor} />
                <StatsCard icon={FaFire} label={t('stats.streak')} value={stats.currentStreak}
                    subLabel={t('stats.streakBest', { best: stats.longestStreak })} color="red.300" delay={0} bg={cardBg} textColor={textColor} />
            </SimpleGrid>

            {/* Heatmap */}
            <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" boxShadow="none" p={5} mb={6}>
                <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={4}>
                    {t('stats.heatmap.title')}
                </Text>
                <ReadingHeatmap dailyActivity={stats.dailyActivity} />
            </Card>

            {/* Insights: Genre + Weekly Pace */}
            <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
                <GridItem>
                    <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" boxShadow="none" p={5} h="full">
                        <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={4}>
                            {t('stats.genre.title')}
                        </Text>
                        <GenreDonutChart genreDistribution={stats.genreDistribution} />
                    </Card>
                </GridItem>
                <GridItem>
                    <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100" boxShadow="none" p={5} h="full">
                        <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={4}>
                            {t('stats.weeklyPace.title')}
                        </Text>
                        <WeeklyPaceChart dailyActivity={stats.dailyActivity} />
                    </Card>
                </GridItem>
            </Grid>
        </Box>
    );
};

export default StatsOverviewPage;
