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
} from '@chakra-ui/react';
import { FaCheckCircle, FaBullseye, FaFire } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { booksApi } from '../features/books/api';
import apiClient from '../api/apiClient';

const MotionBox = motion(Box);

const GoalCard = ({ book, index, t, navigate }) => {
    const progress = book.readingGoalProgress || 0;
    const target = book.readingGoalPages;
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
                                <Text fontSize="sm" fontWeight="bold">Done!</Text>
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
    const navigate = useNavigate();
    const { token } = useAuth();

    const { data: booksData, isLoading: booksLoading } = useQuery({
        queryKey: ['goals', 'books'],
        queryFn: () => booksApi.getWithGoals(),
        enabled: !!token,
    });

    const { data: streak = { currentStreak: 0, longestStreak: 0 } } = useQuery({
        queryKey: ['goals', 'streak'],
        queryFn: () => apiClient.get('/api/sessions/streak'),
        enabled: !!token,
    });

    const books = useMemo(() => {
        const allBooks = booksData || [];

        return [...allBooks].sort((a, b) => {
            const progA = (a.readingGoalProgress || 0) / a.readingGoalPages;
            const progB = (b.readingGoalProgress || 0) / b.readingGoalPages;
            if (a.readingGoalType !== b.readingGoalType) return a.readingGoalType === 'WEEKLY' ? -1 : 1;
            return progB - progA;
        });
    }, [booksData]);

    const loading = booksLoading;
    const activeBooks = books.filter(b => (b.readingGoalProgress || 0) < b.readingGoalPages);
    const completedBooks = books.filter(b => (b.readingGoalProgress || 0) >= b.readingGoalPages);

    return (
        <Box px={{ base: 4, md: 10 }} py={8} maxW="1100px" mx="auto" minH="calc(100vh - 80px)">
            {/* Stats row */}
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb={8} maxW="640px">
                <Box
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    py={4}
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    textAlign="center"
                >
                    <Text fontSize="2xl" fontWeight="bold" color="teal.200">{activeBooks.length}</Text>
                    <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold">
                        {t('home.active')}
                    </Text>
                </Box>
                <Box
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    py={4}
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    textAlign="center"
                >
                    <Text fontSize="2xl" fontWeight="bold" color="green.300">{completedBooks.length}</Text>
                    <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold">
                        {t('bookStats.completed')}
                    </Text>
                </Box>
                <Box
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    py={4}
                    border="1px solid"
                    borderColor={streak.currentStreak > 0 ? 'orange.700' : 'whiteAlpha.100'}
                    textAlign="center"
                >
                    <HStack spacing={2} justify="center">
                        {streak.currentStreak > 0 && <Icon as={FaFire} color="orange.300" />}
                        <Text fontSize="2xl" fontWeight="bold" color="orange.300">{streak.currentStreak}</Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold">
                        {t('home.streak.current')}
                    </Text>
                </Box>
                <Box
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    py={4}
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    textAlign="center"
                >
                    <Text fontSize="2xl" fontWeight="bold" color="gray.300">{streak.longestStreak}</Text>
                    <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold">
                        {t('home.streak.longest')}
                    </Text>
                </Box>
            </SimpleGrid>

            {/* Empty state */}
            {!loading && books.length === 0 && (
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
                            <GoalCard key={book.id} book={book} index={index} t={t} navigate={navigate} />
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
                            <GoalCard key={book.id} book={book} index={index} t={t} navigate={navigate} />
                        ))}
                    </SimpleGrid>
                </>
            )}
        </Box>
    );
};

export default GoalsPage;
