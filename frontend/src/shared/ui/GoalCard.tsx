import { Badge, Box, HStack, Icon, Progress, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const MotionBox = motion(Box);

type GoalBook = {
    title: string;
    author?: string;
    readingGoalProgress?: number | null;
    readingGoalPages?: number | null;
    readingGoalType?: string | null;
};

type GoalCardProps = {
    book: GoalBook;
    index: number;
    linkTo?: string;
};

const GoalCard = ({ book, index, linkTo }: GoalCardProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const progress = book.readingGoalProgress || 0;
    const target = book.readingGoalPages || 1;
    const percent = Math.min(100, Math.round((progress / target) * 100));
    const isFinished = progress >= target;
    const multiplier = isFinished ? Math.floor(progress / target) : 0;

    return (
        <MotionBox
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: index * 0.05 }}
            bg="rgba(248, 236, 214, 0.04)"
            border="1px solid"
            borderColor={isFinished ? 'rgba(126, 151, 112, 0.38)' : 'rgba(217, 188, 146, 0.12)'}
            borderRadius="lg"
            p={5}
            cursor="pointer"
            _hover={{ bg: 'rgba(248, 236, 214, 0.06)', borderColor: 'rgba(217, 188, 146, 0.24)', transform: 'translateY(-1px)', transition: 'all 0.2s' }}
            onClick={() => linkTo && navigate(linkTo)}
        >
            <VStack align="start" spacing={3} w="full">
                <HStack justify="space-between" w="full">
                    <Text fontWeight="600" fontSize="lg" color="#f4ead7" noOfLines={1} flex="1" fontFamily="heading" letterSpacing="-0.02em">
                        {book.title}
                    </Text>
                    <Badge
                        size="sm"
                        bg="rgba(197, 154, 92, 0.12)"
                        color="#d9bc92"
                        variant="solid"
                        flexShrink={0}
                    >
                        {book.readingGoalType === 'WEEKLY' ? t('home.frequency.weekly') : t('home.frequency.monthly')}
                    </Badge>
                </HStack>

                {book.author && (
                    <Text fontSize="sm" color="rgba(217, 204, 182, 0.68)" noOfLines={1}>
                        {book.author}
                    </Text>
                )}

                <HStack justify="space-between" w="full">
                    <Box>
                        {isFinished ? (
                            <HStack spacing={1} color="#95a17f">
                                <Icon as={FaCheckCircle} />
                                <Text fontSize="sm" fontWeight="bold">{t('home.completedGoals')}</Text>
                                {multiplier >= 2 && (
                                    <Text fontSize="sm">({multiplier}x)</Text>
                                )}
                            </HStack>
                        ) : (
                            <Text fontSize="sm" color="rgba(217, 204, 182, 0.64)">
                                {progress} / {target} {t('bookStats.pages')}
                            </Text>
                        )}
                    </Box>
                    <Text
                        fontWeight="bold"
                        fontSize="lg"
                        color={isFinished ? '#95a17f' : '#d9bc92'}
                        fontFamily="heading"
                    >
                        {percent}%
                    </Text>
                </HStack>

                <Progress
                    value={percent}
                    size="sm"
                    w="full"
                    colorScheme={isFinished ? 'green' : undefined}
                    borderRadius="full"
                    bg="rgba(248, 236, 214, 0.08)"
                />
            </VStack>
        </MotionBox>
    );
};

export default GoalCard;
