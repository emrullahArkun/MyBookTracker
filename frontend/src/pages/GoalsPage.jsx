import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Text,
    VStack,
    HStack,
    Progress,
    Icon,
    Badge,
    SimpleGrid,
    Flex,
    Spinner,
} from '@chakra-ui/react';
import { FaCheckCircle, FaBullseye, FaFire } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { booksApi } from '../features/books/api';
import apiClient from '../api/apiClient';

const MotionBox = motion(Box);

const KpiBox = ({ value, label, valueColor, borderColor = 'whiteAlpha.100', children }) => (
    <Box
        bg="whiteAlpha.100"
        borderRadius="xl"
        py={4}
        border="1px solid"
        borderColor={borderColor}
        textAlign="center"
    >
        {children || (
            <Text fontSize="2xl" fontWeight="bold" color={valueColor}>{value}</Text>
        )}
        <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold">
            {label}
        </Text>
    </Box>
);

const GoalCard = ({ book, index }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const progress = book.readingGoalProgress || 0;
    const target = book.readingGoalPages || 1;
    const percent = Math.min(100, Math.round((progress / target) * 100));
    const isFinished = progress >= target;
    const multiplier = isFinished ? Math.floor(progress / target) : 0;

    return (
        <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            bg="whiteAlpha.100"
            border="1px solid"
            borderColor={isFinished ? 'green.700' : 'whiteAlpha.100'}
            borderRadius="xl"
            p={5}
            cursor="pointer"
            _hover={{ bg: 'whiteAlpha.200', transform: 'translateY(-2px)', transition: 'all 0.2s' }}
            onClick={() => navigate(`/books/${book.id}/stats`)}
        >
            <VStack align="start" spacing={3} w="full">
                <HStack justify="space-between" w="full">
                    <Text fontWeight="bold" fontSize="md" color="white" noOfLines={1} flex="1">
                        {book.title}
                    </Text>
                    <Badge
                        size="sm"
                        colorScheme={book.readingGoalType === 'WEEKLY' ? 'purple' : 'blue'}
                        variant="subtle"
                        fontSize="xs"
                        flexShrink={0}
                    >
                        {book.readingGoalType === 'WEEKLY' ? t('home.frequency.weekly') : t('home.frequency.monthly')}
                    </Badge>
                </HStack>

                {book.author && (
                    <Text fontSize="sm" color="gray.500" noOfLines={1}>
                        {book.author}
                    </Text>
                )}

                <HStack justify="space-between" w="full">
                    <Box>
                        {isFinished ? (
                            <HStack spacing={1} color="green.300">
                                <Icon as={FaCheckCircle} />
                                <Text fontSize="sm" fontWeight="bold">{t('home.completedGoals')}</Text>
                                {multiplier >= 2 && (
                                    <Text fontSize="sm">({multiplier}x)</Text>
                                )}
                            </HStack>
                        ) : (
                            <Text fontSize="sm" color="gray.400">
                                {progress} / {target} {t('bookStats.pages')}
                            </Text>
                        )}
                    </Box>
                    <Text
                        fontWeight="bold"
                        fontSize="lg"
                        color={isFinished ? 'green.300' : 'teal.200'}
                    >
                        {percent}%
                    </Text>
                </HStack>

                <Progress
                    value={percent}
                    size="sm"
                    w="full"
                    colorScheme={isFinished ? 'green' : 'teal'}
                    borderRadius="full"
                    bg="whiteAlpha.200"
                />
            </VStack>
        </MotionBox>
    );
};

const GoalsPage = () => {
    const { t } = useTranslation();
    const { token } = useAuth();

    const { data: booksData, isLoading: booksLoading } = useQuery({
        queryKey: ['goals', 'books'],
        queryFn: () => booksApi.getWithGoals(),
        enabled: !!token,
    });

    const { data: streak = { currentStreak: 0, longestStreak: 0 }, isLoading: streakLoading } = useQuery({
        queryKey: ['goals', 'streak'],
        queryFn: () => apiClient.get('/api/stats/streak'),
        enabled: !!token,
    });

    const { activeBooks, completedBooks } = useMemo(() => {
        const allBooks = booksData || [];

        const sorted = [...allBooks].sort((a, b) => {
            if (a.readingGoalType !== b.readingGoalType) return a.readingGoalType === 'WEEKLY' ? -1 : 1;
            const progA = a.readingGoalPages ? (a.readingGoalProgress || 0) / a.readingGoalPages : 0;
            const progB = b.readingGoalPages ? (b.readingGoalProgress || 0) / b.readingGoalPages : 0;
            return progB - progA;
        });

        const active = sorted.filter(b => (b.readingGoalProgress || 0) < (b.readingGoalPages || 0));
        const completed = sorted.filter(b => (b.readingGoalProgress || 0) >= (b.readingGoalPages || 0));

        return { activeBooks: active, completedBooks: completed };
    }, [booksData]);

    const loading = booksLoading || streakLoading;

    if (loading) {
        return (
            <Flex justify="center" align="center" h="calc(100vh - 80px)">
                <Spinner size="xl" color="teal.200" thickness="4px" />
            </Flex>
        );
    }

    return (
        <Box px={{ base: 4, md: 10 }} py={8} maxW="1100px" mx="auto" minH="calc(100vh - 80px)">
            {/* Stats row */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8} maxW="640px">
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

            {/* Empty state */}
            {!loading && activeBooks.length === 0 && completedBooks.length === 0 && (
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

            {/* Active goals */}
            {activeBooks.length > 0 && (
                <>
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" letterSpacing="wider" mb={4}>
                        {t('home.active')} ({activeBooks.length})
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5} mb={8}>
                        {activeBooks.map((book, index) => (
                            <GoalCard key={book.id} book={book} index={index} />
                        ))}
                    </SimpleGrid>
                </>
            )}

            {/* Completed goals */}
            {completedBooks.length > 0 && (
                <>
                    <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="bold" letterSpacing="wider" mb={4}>
                        {t('home.completedGoals')} ({completedBooks.length})
                    </Text>
                    <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                        {completedBooks.map((book, index) => (
                            <GoalCard key={book.id} book={book} index={index} />
                        ))}
                    </SimpleGrid>
                </>
            )}
        </Box>
    );
};

export default GoalsPage;
