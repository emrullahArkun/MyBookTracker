import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Text,
    Progress,
    VStack,
    HStack,
    Icon,
    Badge
} from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../../context/AuthContext';
import { booksApi } from '../../books/api';

const GoalDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { token } = useAuth();

    const { data: booksData = [] } = useQuery({
        queryKey: ['goals', 'dashboard'],
        queryFn: () => booksApi.getWithGoals(),
        enabled: !!token,
    });

    const books = [...booksData].sort((a, b) => {
        const progA = a.readingGoalPages ? (a.readingGoalProgress || 0) / a.readingGoalPages : 0;
        const progB = b.readingGoalPages ? (b.readingGoalProgress || 0) / b.readingGoalPages : 0;
        const finishedA = progA >= 1;
        const finishedB = progB >= 1;

        if (finishedA !== finishedB) return finishedA ? 1 : -1;
        if (a.readingGoalType !== b.readingGoalType) return a.readingGoalType === 'WEEKLY' ? -1 : 1;
        return progB - progA;
    });

    const activeGoalsCount = books.filter(b => (b.readingGoalProgress || 0) < (b.readingGoalPages || 0)).length;

    return (
        <Box position="relative" zIndex="100">
            <Menu>
                <MenuButton
                    as={Button}
                    variant="ghost"
                    color="white"
                    py={10}
                    px={8}
                    _hover={{ bg: 'whiteAlpha.200' }}
                    _active={{ bg: 'whiteAlpha.300' }}
                >
                    <HStack spacing={4} align="center">
                        <Text fontSize="5xl" fontWeight="bold">{t('home.goals')}</Text>
                        {activeGoalsCount > 0 && (
                            <Badge
                                colorScheme="teal"
                                borderRadius="full"
                                px={4}
                                py={1}
                                fontSize="2xl"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                mt="-2px"
                            >
                                {activeGoalsCount}
                            </Badge>
                        )}
                    </HStack>
                </MenuButton>
                <MenuList bg="gray.800" borderColor="gray.700" p={2} boxShadow="xl" maxH="400px" overflowY="auto" width="320px">
                    <Text px={3} py={2} fontSize="xs" fontWeight="bold" color="gray.400" textTransform="uppercase">
                        {t('home.yourTargets')}
                    </Text>

                    {books.length === 0 && (
                        <Box px={3} py={4} textAlign="center" color="gray.500" fontSize="sm">
                            {t('home.noGoals')}
                        </Box>
                    )}

                    {books.map(book => {
                        const progress = book.readingGoalProgress || 0;
                        const target = book.readingGoalPages || 1;
                        const percent = Math.min(100, Math.round((progress / target) * 100));
                        const isFinished = progress >= target;
                        const multiplier = isFinished ? Math.floor(progress / target) : 0;

                        return (
                            <MenuItem
                                key={book.id}
                                bg="transparent"
                                _hover={{ bg: 'whiteAlpha.100' }}
                                borderRadius="md"
                                mb={1}
                                onClick={() => navigate(`/books/${book.id}/stats`)}
                            >
                                <VStack align="start" w="full" spacing={1}>
                                    <HStack justify="space-between" w="full">
                                        <Text fontWeight="bold" fontSize="sm" color="white" noOfLines={1} maxW="180px">
                                            {book.title}
                                        </Text>
                                        <Badge size="sm" colorScheme={book.readingGoalType === 'WEEKLY' ? 'purple' : 'blue'} variant="subtle" fontSize="xx-small">
                                            {book.readingGoalType === 'WEEKLY' ? t('home.frequency.weekly') : t('home.frequency.monthly')}
                                        </Badge>
                                    </HStack>

                                    <HStack justify="space-between" w="full" fontSize="xs" color="gray.400">
                                        <Box>
                                            {isFinished ? (
                                                <HStack spacing={1} color="green.300">
                                                    <Icon as={FaCheckCircle} />
                                                    <Text>{t('home.completedGoals')}</Text>
                                                    {multiplier >= 2 && <Text>({multiplier}x)</Text>}
                                                </HStack>
                                            ) : (
                                                <HStack spacing={1}>
                                                    <Text>{progress} / {target} p.</Text>
                                                </HStack>
                                            )}
                                        </Box>
                                        <Text fontWeight="bold" color={isFinished ? "green.300" : "teal.200"}>{percent}%</Text>
                                    </HStack>

                                    <Progress
                                        value={percent}
                                        size="xs"
                                        w="full"
                                        colorScheme={isFinished ? "green" : "teal"}
                                        borderRadius="full"
                                    />
                                </VStack>
                            </MenuItem>
                        );
                    })}
                </MenuList>
            </Menu>
        </Box>
    );
};

export default GoalDashboard;
