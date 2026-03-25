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
import BookCover from '../../../ui/BookCover';

const MotionBox = motion(Box);

const BookStatsSidebar = ({
    book,
    stats,
    goalProgress,
    onOpenModal,
    cardBg,
    textColor,
    subTextColor
}) => {
    const { t } = useTranslation();

    return (
        <MotionBox
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            h="full"
        >
            <Card
                bg={cardBg}
                borderRadius="2xl"
                border="1px solid"
                borderColor="whiteAlpha.100"
                boxShadow="none"
                p={5}
                h="full"
            >
                <VStack spacing={5} align="center" w="full">
                    {/* Cover Image */}
                    <Box
                        borderRadius="xl"
                        overflow="hidden"
                        boxShadow="lg"
                        maxW="180px"
                        w="100%"
                    >
                        <BookCover
                            book={book}
                            w="100%"
                            h="auto"
                            objectFit="cover"
                            borderRadius="xl"
                        />
                    </Box>

                    {/* Title & Author */}
                    <Box textAlign="center" w="full">
                        <Heading size="md" mb={1} color={textColor} fontWeight="700" lineHeight="1.3">
                            {book.title}
                        </Heading>
                        <Text fontSize="sm" color={subTextColor}>
                            {book.authorName}
                        </Text>
                    </Box>

                    <Box w="full" h="1px" bg="whiteAlpha.100" />

                    {/* Goal Section */}
                    <Box w="full" bg="whiteAlpha.50" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                        <Flex justify="space-between" align="center" mb={2}>
                            <Text fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                                {t('bookStats.goal.title')}
                            </Text>
                            <Button size="xs" colorScheme="teal" variant="ghost" onClick={onOpenModal}>
                                {goalProgress ? t('bookStats.goal.edit') : t('bookStats.goal.set')}
                            </Button>
                        </Flex>

                        {goalProgress ? (
                            <VStack align="start" spacing={1} w="full">
                                <Flex justify="space-between" w="full" fontSize="xs" color="teal.200" mb={1}>
                                    <Text>{goalProgress.type === 'WEEKLY' ? t('bookStats.goal.modal.weekly') : t('bookStats.goal.modal.monthly')}</Text>
                                    <Text>{goalProgress.current} / {goalProgress.target} {t('bookStats.pages')}</Text>
                                </Flex>
                                <Progress
                                    value={goalProgress.percent}
                                    size="xs"
                                    colorScheme={goalProgress.isGoalReached ? "green" : "teal"}
                                    w="full"
                                    borderRadius="full"
                                    bg="whiteAlpha.100"
                                    hasStripe={goalProgress.isGoalReached}
                                    isAnimated={goalProgress.isGoalReached}
                                />
                                {goalProgress.isGoalReached && (
                                    <Flex align="center" mt={1} color="green.300">
                                        <Icon as={FaCheck} mr={1} boxSize={3} />
                                        <Text fontSize="xs" fontWeight="bold">
                                            {goalProgress.type === 'WEEKLY' ? t('bookStats.goal.weeklyInfo') : t('bookStats.goal.monthlyInfo')}
                                            {goalProgress.multiplier >= 2 && (
                                                <Text as="span" ml={1} color="green.200" textTransform="uppercase" fontSize="xx-s">
                                                    ({goalProgress.multiplier}x {t('bookStats.goal.surpassed')}!)
                                                </Text>
                                            )}
                                        </Text>
                                    </Flex>
                                )}
                            </VStack>
                        ) : (
                            <Text fontSize="xs" color="gray.500">{t('bookStats.goal.noGoal')}</Text>
                        )}
                    </Box>

                    {/* Progress Section */}
                    {stats && (
                        <Box w="full">
                            <Flex justify="space-between" mb={2} fontSize="xs" fontWeight="600" color="gray.400" textTransform="uppercase" letterSpacing="wider">
                                <Text>{t('bookStats.readProgress')}</Text>
                                <Text>{stats.progressPercent}%</Text>
                            </Flex>
                            <Progress
                                value={stats.progressPercent}
                                size="xs"
                                colorScheme="teal"
                                borderRadius="full"
                                bg="whiteAlpha.100"
                            />
                            <Text fontSize="xs" color="gray.400" mt={2} textAlign="center">
                                {stats.pagesRead} <span style={{ opacity: 0.5 }}>/</span> {stats.totalPages} {t('bookStats.pages')}
                            </Text>
                        </Box>
                    )}

                    {book.completed && (
                        <Badge
                            colorScheme="teal"
                            variant="solid"
                            fontSize="xs"
                            px={3}
                            py={1}
                            borderRadius="full"
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
