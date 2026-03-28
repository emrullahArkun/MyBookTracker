import {
    Box,
    Heading,
    Text,
    Flex,
    Button,
    Card,
    VStack,
    Icon,
    Progress,
    Badge
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import BookCover from '../../../shared/ui/BookCover';

const MotionBox = motion(Box);

const BookStatsSidebar = ({
    book,
    stats,
    goalProgress,
    onOpenModal,
    textColor,
    subTextColor,
    compact = false,
}) => {
    const { t } = useTranslation();

    return (
        <MotionBox
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28 }}
            h="full"
        >
            <Card
                boxShadow="none"
                p={compact ? 4 : 5}
                h="full"
                overflow="hidden"
                bg="transparent"
                border="none"
            >
                <VStack spacing={compact ? 3 : 5} align="center" w="full">
                    <Box
                        borderRadius="lg"
                        overflow="hidden"
                        boxShadow="0 18px 28px rgba(8, 6, 4, 0.26)"
                        maxW={compact ? '120px' : '180px'}
                        w="100%"
                    >
                        <BookCover
                            book={book}
                            w="100%"
                            h="auto"
                            objectFit="cover"
                            borderRadius="lg"
                        />
                    </Box>

                    <Box textAlign="center" w="full">
                        <Text fontSize="0.66rem" textTransform="uppercase" letterSpacing="0.14em" color="rgba(217, 204, 182, 0.56)" mb={2}>
                            {t('bookStats.profile')}
                        </Text>
                        <Heading size={compact ? 'md' : 'lg'} mb={1} color={textColor} fontWeight="600" lineHeight="1.1" noOfLines={compact ? 2 : undefined} fontFamily="heading">
                            {book.title}
                        </Heading>
                        <Text fontSize={compact ? 'sm' : 'md'} color={subTextColor} noOfLines={1}>
                            {book.authorName}
                        </Text>
                    </Box>

                    <Box w="full" h="1px" bg="rgba(217, 188, 146, 0.1)" />

                    <Box w="full" bg="rgba(248, 236, 214, 0.05)" p={4} borderRadius="xl" border="1px solid" borderColor="rgba(217, 188, 146, 0.1)">
                        <Flex justify="space-between" align="center" mb={2}>
                            <Text fontSize="0.68rem" fontWeight="700" color="rgba(217, 204, 182, 0.56)" textTransform="uppercase" letterSpacing="0.14em">
                                {t('bookStats.goal.title')}
                            </Text>
                            <Button size="xs" variant="ghost" onClick={onOpenModal}>
                                {goalProgress ? t('bookStats.goal.edit') : t('bookStats.goal.set')}
                            </Button>
                        </Flex>

                        {goalProgress ? (
                            <VStack align="start" spacing={1} w="full">
                                <Flex justify="space-between" w="full" fontSize="xs" color="#d9bc92" mb={1}>
                                    <Text>{goalProgress.type === 'WEEKLY' ? t('bookStats.goal.modal.weekly') : t('bookStats.goal.modal.monthly')}</Text>
                                    <Text>{goalProgress.current} / {goalProgress.target} {t('bookStats.pages')}</Text>
                                </Flex>
                                <Progress
                                    value={goalProgress.percent}
                                    size="xs"
                                    colorScheme={goalProgress.isGoalReached ? "green" : undefined}
                                    w="full"
                                    borderRadius="full"
                                    bg="rgba(248, 236, 214, 0.08)"
                                    hasStripe={goalProgress.isGoalReached}
                                    isAnimated={goalProgress.isGoalReached}
                                />
                                {goalProgress.isGoalReached && (
                                    <Flex align="center" mt={1} color="#95a17f">
                                        <Icon as={FaCheck} mr={1} boxSize={3} />
                                        <Text fontSize="xs" fontWeight="bold">
                                            {goalProgress.type === 'WEEKLY' ? t('bookStats.goal.weeklyInfo') : t('bookStats.goal.monthlyInfo')}
                                            {goalProgress.multiplier >= 2 && (
                                                <Text as="span" ml={1} color="#b3c19e" textTransform="uppercase" fontSize="xx-s">
                                                    ({goalProgress.multiplier}x {t('bookStats.goal.surpassed')}!)
                                                </Text>
                                            )}
                                        </Text>
                                    </Flex>
                                )}
                            </VStack>
                        ) : (
                            <Text fontSize="xs" color="rgba(217, 204, 182, 0.56)">{t('bookStats.goal.noGoal')}</Text>
                        )}
                    </Box>

                    {stats && (
                        <Box w="full">
                            <Flex justify="space-between" mb={2} fontSize="0.68rem" fontWeight="700" color="rgba(217, 204, 182, 0.56)" textTransform="uppercase" letterSpacing="0.14em">
                                <Text>{t('bookStats.readProgress')}</Text>
                                <Text>{stats.progressPercent}%</Text>
                            </Flex>
                            <Progress
                                value={stats.progressPercent}
                                size="xs"
                                borderRadius="full"
                                bg="rgba(248, 236, 214, 0.08)"
                            />
                            <Text fontSize="xs" color="rgba(217, 204, 182, 0.64)" mt={2} textAlign="center">
                                {stats.pagesRead} <span style={{ opacity: 0.5 }}>/</span> {stats.totalPages} {t('bookStats.pages')}
                            </Text>
                        </Box>
                    )}

                    {book.completed && (
                        <Badge
                            bg="rgba(149, 161, 127, 0.18)"
                            color="#c7d1b5"
                            variant="solid"
                        >
                            <Icon as={FaCheck} mr={1} />
                            {t('bookStats.completed')}
                        </Badge>
                    )}
                </VStack>
            </Card>
        </MotionBox>
    );
};

export default BookStatsSidebar;
