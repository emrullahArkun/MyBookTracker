import { Badge, Box, HStack, Icon, Progress, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes';

const MotionBox = motion(Box);

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
            onClick={() => navigate(ROUTES.BOOK_STATS(book.id))}
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

export default GoalCard;
