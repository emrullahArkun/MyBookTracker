import { useState, useEffect } from 'react';
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
    Heading,
} from '@chakra-ui/react';
import { FaCheckCircle, FaBullseye } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { booksApi } from '../features/books/api';
import { usePinstripeBackground } from '../shared/hooks/usePinstripeBackground';

const MotionBox = motion(Box);

const GoalsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    usePinstripeBackground();

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const response = await booksApi.getAll(0, 50);
                const allBooks = response.content || [];
                const booksWithGoals = allBooks.filter(b => b.readingGoalType && b.readingGoalPages > 0);

                const sorted = booksWithGoals.sort((a, b) => {
                    const progA = (a.readingGoalProgress || 0) / a.readingGoalPages;
                    const progB = (b.readingGoalProgress || 0) / b.readingGoalPages;
                    const finishedA = progA >= 1;
                    const finishedB = progB >= 1;

                    if (finishedA !== finishedB) return finishedA ? 1 : -1;
                    if (a.readingGoalType !== b.readingGoalType) return a.readingGoalType === 'WEEKLY' ? -1 : 1;
                    return progB - progA;
                });

                setBooks(sorted);
            } catch (error) {
                console.error("Failed to fetch goals", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGoals();
    }, []);

    const activeCount = books.filter(b => (b.readingGoalProgress || 0) < b.readingGoalPages).length;
    const completedCount = books.filter(b => (b.readingGoalProgress || 0) >= b.readingGoalPages).length;

    return (
        <Box px={{ base: 4, md: 10 }} py={8} maxW="1100px" mx="auto" minH="calc(100vh - 80px)">
            {/* Header */}
            <HStack spacing={4} mb={2}>
                <Icon as={FaBullseye} color="teal.300" boxSize={8} />
                <Heading size="2xl" color="white" fontWeight="bold">
                    {t('navbar.goals')}
                </Heading>
            </HStack>
            <Text color="gray.400" mb={8} fontSize="md">
                {t('home.yourTargets')}
            </Text>

            {/* Stats summary */}
            <HStack spacing={4} mb={8}>
                <Box
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    px={6}
                    py={4}
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                >
                    <Text fontSize="2xl" fontWeight="bold" color="teal.200">{activeCount}</Text>
                    <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold">
                        {t('home.active')}
                    </Text>
                </Box>
                <Box
                    bg="whiteAlpha.100"
                    borderRadius="xl"
                    px={6}
                    py={4}
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                >
                    <Text fontSize="2xl" fontWeight="bold" color="green.300">{completedCount}</Text>
                    <Text fontSize="xs" color="gray.400" textTransform="uppercase" fontWeight="bold">
                        {t('bookStats.completed')}
                    </Text>
                </Box>
            </HStack>

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
                    <Icon as={FaBullseye} color="gray.600" boxSize={12} mb={4} />
                    <Text color="gray.400" fontSize="lg">{t('home.noGoals')}</Text>
                    <Text color="gray.500" fontSize="sm" mt={2}>
                        {t('bookStats.goal.set')} — {t('bookStats.goal.title')}
                    </Text>
                </Box>
            )}

            {/* Goal cards */}
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
                {books.map((book, index) => {
                    const progress = book.readingGoalProgress || 0;
                    const target = book.readingGoalPages;
                    const percent = Math.min(100, Math.round((progress / target) * 100));
                    const isFinished = progress >= target;
                    const multiplier = isFinished ? Math.floor(progress / target) : 0;

                    return (
                        <MotionBox
                            key={book.id}
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
                                {/* Title & badge */}
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

                                {/* Author */}
                                {book.author && (
                                    <Text fontSize="sm" color="gray.500" noOfLines={1}>
                                        {book.author}
                                    </Text>
                                )}

                                {/* Progress info */}
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

                                {/* Progress bar */}
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
                })}
            </SimpleGrid>
        </Box>
    );
};

export default GoalsPage;
