import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Grid,
    GridItem,
    SimpleGrid,
    useDisclosure,
    useToast,
    Spinner,
    Flex,
    VStack,
    Text,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalBody,
    Button,
    Icon
} from '@chakra-ui/react';
import { FaBookReader } from 'react-icons/fa';
import { booksApi } from '../../books/api';
import { useBookStats } from '../hooks/useBookStats';
import { useBookStatsCalculations } from '../hooks/useBookStatsCalculations';

import { useThemeTokens } from '../../../shared/hooks/useThemeTokens';
import { FaBookOpen, FaChartLine, FaClock } from 'react-icons/fa';

import StatsCard from '../components/StatsCard';
import BookGoalModal from '../components/BookGoalModal';
import BookStatsSidebar from '../components/BookStatsSidebar';
import BookStatsCharts from '../components/BookStatsCharts';

const BookStatsPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();

    // Custom Hook for Data
    const { book, sessions, loading, refetch } = useBookStats(id);

    // Custom Hook for Calculations
    const { stats, goalProgress } = useBookStatsCalculations(book, sessions);

    // Goal State
    const [goalType, setGoalType] = useState('WEEKLY');
    const [goalPages, setGoalPages] = useState('');
    const [isSavingGoal, setIsSavingGoal] = useState(false);

    useEffect(() => {
        if (book?.readingGoalType) setGoalType(book.readingGoalType);
        if (book?.readingGoalPages) setGoalPages(book.readingGoalPages);
    }, [book]);

    const handleSaveGoal = async () => {
        setIsSavingGoal(true);
        try {
            await booksApi.updateGoal(id, goalType, parseInt(goalPages, 10));
            toast({ title: t('bookStats.goal.modal.success'), status: 'success', duration: 3000 });
            refetch();
            onClose();
        } catch (error) {
            toast({ title: t('bookStats.goal.modal.error'), status: 'error', duration: 3000 });
        } finally {
            setIsSavingGoal(false);
        }
    };

    const { bgColor, cardBg, textColor, subTextColor, brandColor } = useThemeTokens();

    const hasSessions = sessions && sessions.length > 0;

    if (loading) return (
        <Flex justify="center" align="center" h="100vh" bg={bgColor}>
            <Spinner size="xl" color={brandColor} thickness="4px" />
        </Flex>
    );

    if (!book) return <Box textAlign="center" py={20} color={textColor}>{t('bookStats.notFound')}</Box>;

    return (
        <Box bg={bgColor} h="calc(100vh - 60px)" px={{ base: 4, md: 8 }} pt={5} pb={5} w="100%" overflow="hidden" display="flex" flexDirection="column">
            <Box w="100%" flex="1" minH="0">

                <Grid templateColumns={{ base: "1fr", lg: "280px 1fr" }} gap={6} alignItems="start" w="100%" h="full">
                    {/* Left Sidebar: Detailed Book Info */}
                    <GridItem h="full" overflow="auto" css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                        <BookStatsSidebar
                            book={book}
                            stats={stats}
                            goalProgress={goalProgress}
                            onOpenModal={onOpen}
                            cardBg={cardBg}
                            textColor={textColor}
                            subTextColor={subTextColor}
                        />
                    </GridItem>

                    {/* Right Content: Dashboard */}
                    <GridItem w="full" h="full" display="flex" flexDirection="column" overflow="hidden">
                        <VStack spacing={5} align="stretch" w="full" h="full" overflow="hidden">
                            {/* KPI Cards */}
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5} flexShrink={0}>
                                <StatsCard
                                    icon={FaClock}
                                    label={t('bookStats.totalTime.label')}
                                    value={hasSessions ? (stats?.totalTime || '-') : '-'}
                                    subLabel={t('bookStats.totalTime.subLabel')}
                                    color="teal.200"
                                    delay={0.1}
                                    bg={cardBg}
                                    textColor={textColor}
                                />
                                <StatsCard
                                    icon={FaBookOpen}
                                    label={t('bookStats.speed.label')}
                                    value={hasSessions ? (stats?.speed || '-') : '-'}
                                    subLabel={t('bookStats.speed.subLabel')}
                                    color="blue.200"
                                    delay={0.2}
                                    bg={cardBg}
                                    textColor={textColor}
                                />
                                {!book.completed && (
                                    <StatsCard
                                        icon={FaChartLine}
                                        label={t('bookStats.projection.label')}
                                        value={hasSessions ? `~${stats?.timeLeft || '-'}` : '-'}
                                        subLabel={t('bookStats.projection.subLabel')}
                                        color="purple.200"
                                        delay={0.3}
                                        bg={cardBg}
                                        textColor={textColor}
                                    />
                                )}
                            </SimpleGrid>

                            {/* Main Chart */}
                            {stats && (
                                <BookStatsCharts
                                    stats={stats}
                                    sessions={sessions}
                                    bookId={id}
                                    cardBg={cardBg}
                                    textColor={textColor}
                                    subTextColor={subTextColor}
                                />
                            )}
                        </VStack>
                    </GridItem>
                </Grid>
            </Box>

            {/* No Sessions Modal */}
            <Modal isOpen={!hasSessions && !loading && !!book} onClose={() => navigate(ROUTES.MY_BOOKS)} isCentered>
                <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
                <ModalContent bg="gray.900" border="1px solid" borderColor="whiteAlpha.100" borderRadius="2xl" mx={4}>
                    <ModalBody py={10} px={8} textAlign="center">
                        <Flex justify="center" mb={5}>
                            <Flex w={16} h={16} borderRadius="full" bg="whiteAlpha.100" align="center" justify="center">
                                <Icon as={FaBookReader} boxSize={7} color="teal.200" />
                            </Flex>
                        </Flex>
                        <Text fontSize="lg" fontWeight="700" color="white" mb={2}>
                            {t('bookStats.noSessions.title')}
                        </Text>
                        <Text fontSize="sm" color="gray.400" mb={6}>
                            {t('bookStats.noSessions.desc')}
                        </Text>
                        <Flex direction="column" gap={3} align="center">
                            <Button
                                colorScheme="teal"
                                size="lg"
                                borderRadius="xl"
                                px={10}
                                onClick={() => navigate(`/books/${id}/session`)}
                            >
                                {t('bookStats.noSessions.button')}
                            </Button>
                            <Button
                                variant="ghost"
                                color="gray.400"
                                size="sm"
                                onClick={() => navigate(ROUTES.MY_BOOKS)}
                                _hover={{ color: 'white' }}
                            >
                                {t('common.back')}
                            </Button>
                        </Flex>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Set Goal Modal */}
            <BookGoalModal
                isOpen={isOpen}
                onClose={onClose}
                goalType={goalType}
                setGoalType={setGoalType}
                goalPages={goalPages}
                setGoalPages={setGoalPages}
                handleSaveGoal={handleSaveGoal}
                isSavingGoal={isSavingGoal}
            />
        </Box>
    );
};

export default BookStatsPage;
