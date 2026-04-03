import { useTranslation } from 'react-i18next';
import {
    Box,
    Text,
    HStack,
    Icon,
    SimpleGrid,
    Flex,
    Spinner,
} from '@chakra-ui/react';
import { FaBullseye, FaFire } from 'react-icons/fa';
import GoalCard from '../../../shared/ui/GoalCard';
import KpiBox from '../ui/KpiBox';
import { useGoalsData } from '../model/useGoalsData';
import PageErrorState from '../../../shared/ui/PageErrorState';
import { ROUTES } from '../../../app/router/routes';

const GoalsPage = () => {
    const { t } = useTranslation();
    const { activeBooks, completedBooks, streak, loading, isError, error, refresh } = useGoalsData();

    if (loading) {
        return (
            <Flex justify="center" align="center" h="calc(100vh - 80px)">
                <Spinner size="xl" color="teal.200" thickness="4px" />
            </Flex>
        );
    }

    if (isError) {
        return (
            <PageErrorState
                title={t('myBooks.error', { message: error || t('stats.error') })}
                onRetry={refresh}
                retryLabel={t('discovery.retry')}
            />
        );
    }

    return (
        <Box px={{ base: 4, md: 8 }} py={8} maxW="1100px" mx="auto" minH="calc(100vh - 80px)">
            <Box mb={8}>
                <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wider" mb={2}>
                    {t('navbar.goals')}
                </Text>
                <Text color="gray.300" maxW="56ch" lineHeight="1.7">
                    {t('home.goalSectionHint')}
                </Text>
            </Box>

            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8}>
                <KpiBox value={activeBooks.length} label={t('home.active')} valueColor="teal.200" />
                <KpiBox value={completedBooks.length} label={t('bookStats.completed')} valueColor="green.300" />
                <KpiBox
                    label={t('home.streak.current')}
                    borderColor={streak.currentStreak > 0 ? 'orange.700' : 'whiteAlpha.100'}
                >
                    <HStack spacing={2} justify="center">
                        {streak.currentStreak > 0 && <Icon as={FaFire} color="orange.300" />}
                        <Text fontSize="2xl" fontWeight="bold" color="orange.300">{streak.currentStreak}</Text>
                    </HStack>
                </KpiBox>
                <KpiBox value={streak.longestStreak} label={t('home.streak.longest')} valueColor="gray.300" />
            </SimpleGrid>

            {activeBooks.length === 0 && completedBooks.length === 0 && (
                <Box
                    textAlign="center"
                    py={16}
                    bg="whiteAlpha.50"
                    borderRadius="2xl"
                    border="1px dashed"
                    borderColor="whiteAlpha.200"
                >
                    <Icon as={FaBullseye} color="gray.400" boxSize={12} mb={4} />
                    <Text color="gray.300" fontSize="lg">{t('home.noGoals')}</Text>
                    <Text color="gray.400" fontSize="sm" mt={2}>
                        {t('home.noGoalsHint')}
                    </Text>
                </Box>
            )}

            {activeBooks.length > 0 && (
                <>
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" letterSpacing="wider" mb={4}>
                        {t('home.active')} ({activeBooks.length})
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} mb={8}>
                        {activeBooks.map((book, index) => (
                            <GoalCard key={book.id} book={book} index={index} linkTo={ROUTES.BOOK_STATS(book.id)} />
                        ))}
                    </SimpleGrid>
                </>
            )}

            {completedBooks.length > 0 && (
                <>
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" letterSpacing="wider" mb={4}>
                        {t('home.completedGoals')} ({completedBooks.length})
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                        {completedBooks.map((book, index) => (
                            <GoalCard key={book.id} book={book} index={index} linkTo={ROUTES.BOOK_STATS(book.id)} />
                        ))}
                    </SimpleGrid>
                </>
            )}
        </Box>
    );
};

export default GoalsPage;
