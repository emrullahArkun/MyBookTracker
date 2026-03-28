import { Link as RouterLink } from 'react-router-dom';
import {
    Badge,
    Box,
    Button,
    Flex,
    Grid,
    GridItem,
    Heading,
    Icon,
    Progress,
    SimpleGrid,
    Spinner,
    Stack,
    Text,
} from '@chakra-ui/react';
import { FaBookOpen, FaBullseye, FaCompass, FaFire, FaForward } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '../../../app/router/routes';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';
import PageErrorState from '../../../shared/ui/PageErrorState';
import BookCover from '../../../shared/ui/BookCover';
import GoalCard from '../../goals/ui/GoalCard';
import { useHomeFocusData } from '../model/useHomeFocusData';

const HomePage = () => {
    const { t } = useTranslation();
    const {
        cardBg,
        textColor,
        subTextColor,
        mutedTextColor,
        brandColor,
        borderColor,
        subtleBorderColor,
        panelInsetBg,
        panelShadow,
    } = useThemeTokens();
    const {
        activeSession,
        currentBook,
        queuedBooks,
        activeGoalBooks,
        activeGoalCount,
        streak,
        activeBooksCount,
        completedBooksCount,
        weekDays,
        lastActivity,
        readingRhythm,
        todaySuggestion,
        resumeSuggestion,
        greetingKey,
        loading,
        isError,
        error,
        refresh,
    } = useHomeFocusData();

    if (loading) {
        return (
            <Flex justify="center" align="center" h="calc(100vh - 80px)">
                <Spinner size="xl" color={brandColor} thickness="4px" />
            </Flex>
        );
    }

    if (isError) {
        return (
            <PageErrorState
                title={t('myBooks.error', { message: error || t('stats.error') })}
                onRetry={refresh}
                retryLabel={t('common.retry')}
            />
        );
    }

    const progressPercent = currentBook && currentBook.pageCount
        ? Math.round(((currentBook.currentPage || 0) / currentBook.pageCount) * 100)
        : 0;

    const currentBookSessionRoute = currentBook ? ROUTES.BOOK_SESSION(currentBook.id) : null;

    const lastActivityText = lastActivity.type === 'today'
        ? t('home.lastActivityToday', { pages: lastActivity.pages, title: lastActivity.title })
        : lastActivity.type === 'yesterday'
            ? t('home.lastActivity', { pages: lastActivity.pages, title: lastActivity.title })
            : t('home.lastActivityNone');

    const readingDaysThisWeek = weekDays.filter((d) => d.pagesRead > 0).length;
    const weekDayLabels = t('home.weekDays', { returnObjects: true }) as string[];
    const maxWeekPages = Math.max(...weekDays.map((day) => day.pagesRead), 1);
    const panelStyles = {
        bg: cardBg,
        border: '1px solid',
        borderColor,
        borderRadius: '2xl',
        boxShadow: panelShadow,
    };
    const insetStyles = {
        bg: panelInsetBg,
        border: '1px solid',
        borderColor: subtleBorderColor,
        borderRadius: 'xl',
    };

    return (
        <Box px={{ base: 4, md: 8 }} py={{ base: 5, md: 8 }} maxW="1180px" mx="auto" minH="calc(100vh - 80px)">
            <Flex
                justify="space-between"
                align={{ base: 'flex-start', xl: 'flex-end' }}
                direction={{ base: 'column', xl: 'row' }}
                gap={6}
                mb={8}
            >
                <Box maxW="44rem">
                    <Text
                        color={brandColor}
                        fontSize="0.72rem"
                        fontWeight="700"
                        textTransform="uppercase"
                        letterSpacing="0.16em"
                        mb={3}
                    >
                        {t('home.focusBadge')}
                    </Text>
                    <Heading
                        color={textColor}
                        fontSize={{ base: '2.5rem', md: '3.25rem' }}
                        lineHeight={{ base: '0.98', md: '0.94' }}
                        mb={3}
                    >
                        {t(greetingKey)}
                    </Heading>
                    <Text color={subTextColor} fontSize={{ base: 'md', md: 'lg' }} lineHeight="1.8" maxW="38rem">
                        {lastActivityText}
                    </Text>
                </Box>

                <Box
                    {...panelStyles}
                    w={{ base: '100%', xl: '320px' }}
                    px={5}
                    py={4}
                >
                    <Text fontSize="0.68rem" fontWeight="700" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" mb={3}>
                        {t('home.ledgerTitle')}
                    </Text>
                    <SimpleGrid columns={3} spacing={3}>
                        <Box>
                            <Text color={brandColor} fontSize="2xl" fontFamily="heading" lineHeight="1">
                                {readingDaysThisWeek}
                            </Text>
                            <Text color={mutedTextColor} fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
                                {t('home.streak.days')}
                            </Text>
                        </Box>
                        <Box>
                            <Text color="#95a17f" fontSize="2xl" fontFamily="heading" lineHeight="1">
                                {activeBooksCount}
                            </Text>
                            <Text color={mutedTextColor} fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
                                {t('home.activeBooks')}
                            </Text>
                        </Box>
                        <Box>
                            <Text color={textColor} fontSize="2xl" fontFamily="heading" lineHeight="1">
                                {streak.currentStreak}
                            </Text>
                            <Text color={mutedTextColor} fontSize="xs" textTransform="uppercase" letterSpacing="0.14em">
                                {t('home.streak.current')}
                            </Text>
                        </Box>
                    </SimpleGrid>
                </Box>
            </Flex>

            <Grid templateColumns={{ base: '1fr', xl: '1.55fr 0.95fr' }} gap={6} mb={8}>
                <GridItem>
                    <Box {...panelStyles} p={{ base: 5, md: 7 }} minH="100%">
                        <Stack spacing={6}>
                            <Flex
                                justify="space-between"
                                gap={4}
                                align={{ base: 'flex-start', md: 'center' }}
                                direction={{ base: 'column', md: 'row' }}
                                pb={4}
                                borderBottom="1px solid"
                                borderColor={subtleBorderColor}
                            >
                                <Box>
                                    <Badge bg="rgba(197, 154, 92, 0.12)" color={brandColor}>
                                        {activeSession ? t('home.currentSessionLabel') : t('home.currentBookLabel')}
                                    </Badge>
                                    <Heading color={textColor} fontSize={{ base: '2rem', md: '2.5rem' }} mt={4} mb={2}>
                                        {t('home.focusTitle')}
                                    </Heading>
                                    <Text color={subTextColor} maxW="34rem" lineHeight="1.8" fontSize="sm">
                                        {t('home.focusSubtitle')}
                                    </Text>
                                </Box>
                                <Text color={mutedTextColor} fontSize="xs" textTransform="uppercase" letterSpacing="0.16em">
                                    {t('home.journalLabel')}
                                </Text>
                            </Flex>

                            {currentBook ? (
                                <Grid
                                    templateColumns={{ base: '1fr', md: '156px 1fr' }}
                                    gap={{ base: 5, md: 6 }}
                                    alignItems="start"
                                >
                                    <Box {...insetStyles} p={3} w={{ base: '100%', md: '156px' }}>
                                        <Box
                                            w="100%"
                                            h={{ base: '220px', md: '228px' }}
                                            borderRadius="md"
                                            overflow="hidden"
                                            boxShadow="0 14px 24px rgba(8, 6, 4, 0.22)"
                                        >
                                            <BookCover book={currentBook} w="100%" h="100%" borderRadius="md" />
                                        </Box>
                                    </Box>
                                    <Stack spacing={4} flex="1">
                                        <Box pb={4} borderBottom="1px solid" borderColor={subtleBorderColor}>
                                            <Text fontSize="0.68rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" mb={2}>
                                                {t('home.focusBookLabel')}
                                            </Text>
                                            <Heading fontSize={{ base: '1.8rem', md: '2.35rem' }} color={textColor} mb={1}>
                                                {currentBook.title}
                                            </Heading>
                                            <Text color={subTextColor} fontSize="md">{currentBook.authorName}</Text>
                                        </Box>

                                        <Box {...insetStyles} p={4}>
                                            <Flex justify="space-between" mb={2} color={subTextColor} fontSize="sm" align="center">
                                                <Text textTransform="uppercase" letterSpacing="0.14em" fontSize="0.68rem" color={mutedTextColor}>
                                                    {t('home.progressLabel')}
                                                </Text>
                                                <Text>
                                                    {currentBook.currentPage || 0}
                                                    {currentBook.pageCount ? ` / ${currentBook.pageCount}` : ''}
                                                </Text>
                                            </Flex>
                                            <Progress
                                                value={progressPercent}
                                                size="sm"
                                                borderRadius="full"
                                                bg="rgba(248, 236, 214, 0.08)"
                                            />
                                        </Box>

                                        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
                                            <Box {...insetStyles} p={3}>
                                                <Text fontSize="0.66rem" textTransform="uppercase" letterSpacing="0.14em" color={mutedTextColor} mb={1}>
                                                    {t('home.activeBooks')}
                                                </Text>
                                                <Text fontSize="2xl" fontFamily="heading" color={textColor}>
                                                    {activeBooksCount}
                                                </Text>
                                            </Box>
                                            <Box {...insetStyles} p={3}>
                                                <Text fontSize="0.66rem" textTransform="uppercase" letterSpacing="0.14em" color={mutedTextColor} mb={1}>
                                                    {t('home.activeGoals')}
                                                </Text>
                                                <Text fontSize="2xl" fontFamily="heading" color={brandColor}>
                                                    {activeGoalCount}
                                                </Text>
                                            </Box>
                                            <Box {...insetStyles} p={3}>
                                                <Text fontSize="0.66rem" textTransform="uppercase" letterSpacing="0.14em" color={mutedTextColor} mb={1}>
                                                    {t('home.completedBooks')}
                                                </Text>
                                                <Text fontSize="2xl" fontFamily="heading" color="#95a17f">
                                                    {completedBooksCount}
                                                </Text>
                                            </Box>
                                        </SimpleGrid>

                                        <Flex wrap="wrap" gap={3} pt={1}>
                                            {currentBookSessionRoute && (
                                                <Button
                                                    as={RouterLink}
                                                    to={currentBookSessionRoute}
                                                    leftIcon={<FaBookOpen />}
                                                    size="sm"
                                                >
                                                    {activeSession ? t('home.resumeSession') : t('home.startSession')}
                                                </Button>
                                            )}
                                            <Button
                                                as={RouterLink}
                                                to={ROUTES.MY_BOOKS}
                                                variant="outline"
                                                size="sm"
                                            >
                                                {t('home.openLibrary')}
                                            </Button>
                                        </Flex>
                                    </Stack>
                                </Grid>
                            ) : (
                                <Box {...insetStyles} p={5}>
                                    <Heading size="md" color={textColor} mb={2}>
                                        {t('home.noCurrentBook')}
                                    </Heading>
                                    <Text color={subTextColor} mb={4} fontSize="sm">
                                        {t('home.noCurrentBookHint')}
                                    </Text>
                                    <Flex wrap="wrap" gap={3}>
                                        <Button as={RouterLink} to={ROUTES.SEARCH} leftIcon={<FaCompass />} size="sm">
                                            {t('home.findBook')}
                                        </Button>
                                        <Button as={RouterLink} to={ROUTES.MY_BOOKS} variant="outline" size="sm">
                                            {t('home.openLibrary')}
                                        </Button>
                                    </Flex>
                                </Box>
                            )}
                        </Stack>
                    </Box>
                </GridItem>

                <GridItem>
                    <Stack spacing={4} h="100%">
                        <Box {...panelStyles} p={5}>
                            <Text fontSize="0.68rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" fontWeight="700" mb={2}>
                                {t('home.todaySuggestion.label')}
                            </Text>
                            <Heading size="md" color={textColor} mb={2} lineHeight="1.3">
                                {todaySuggestion.kind === 'finish'
                                    ? t('home.todaySuggestion.finishTitle', {
                                        pages: todaySuggestion.suggestedPages,
                                        title: todaySuggestion.title,
                                    })
                                    : todaySuggestion.kind === 'continue'
                                        ? t('home.todaySuggestion.progressTitle', {
                                            pages: todaySuggestion.suggestedPages,
                                            title: todaySuggestion.title,
                                        })
                                        : t('home.todaySuggestion.emptyTitle')}
                            </Heading>
                            <Text color={subTextColor} fontSize="sm" lineHeight="1.8">
                                {todaySuggestion.kind === 'finish'
                                    ? t('home.todaySuggestion.finishBody', { title: todaySuggestion.title })
                                    : todaySuggestion.kind === 'continue'
                                        ? t('home.todaySuggestion.progressBody', {
                                            targetPage: todaySuggestion.targetPage,
                                            remaining: todaySuggestion.remainingPages,
                                        })
                                        : t('home.todaySuggestion.emptyBody')}
                            </Text>
                        </Box>

                        <Box {...panelStyles} p={5}>
                            <Text fontSize="0.68rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" fontWeight="700" mb={2}>
                                {t('home.rhythm.label')}
                            </Text>
                            <Heading size="md" color={textColor} mb={2} lineHeight="1.3">
                                {readingRhythm.enoughData
                                    ? t('home.rhythm.summaryTitle', {
                                        timeOfDay: t(`home.rhythm.timeOfDay.${readingRhythm.preferredTimeOfDay}`),
                                    })
                                    : readingRhythm.hasAnySessions
                                        ? t('home.rhythm.buildingTitle')
                                        : t('home.rhythm.emptyTitle')}
                            </Heading>
                            <Text color={subTextColor} fontSize="sm" lineHeight="1.8" mb={4}>
                                {readingRhythm.enoughData
                                    ? t('home.rhythm.summaryBody', {
                                        sessionLength: t(`home.rhythm.sessionLength.${readingRhythm.preferredSessionLength}`),
                                        minutes: readingRhythm.averageMinutesPerSession,
                                        pages: readingRhythm.averagePagesPerSession,
                                    })
                                    : readingRhythm.hasAnySessions
                                        ? t('home.rhythm.buildingBody', {
                                            sessions: readingRhythm.sessionsLast14,
                                            days: readingRhythm.activeDaysLast14,
                                        })
                                        : t('home.rhythm.emptyBody')}
                            </Text>
                            <Flex justify="space-between" align="center" mb={4}>
                                <Text fontSize="xs" color={mutedTextColor}>
                                    {readingRhythm.hasAnySessions
                                        ? t(`home.rhythm.consistency.${readingRhythm.consistency}`)
                                        : t('home.rhythm.consistency.empty')}
                                </Text>
                                <Flex align="center" gap={1.5}>
                                    {streak.currentStreak > 0 && <Icon as={FaFire} color={brandColor} boxSize={3} />}
                                    <Text fontSize="xs" fontWeight="600" color={streak.currentStreak > 0 ? brandColor : mutedTextColor}>
                                        {streak.currentStreak} {t('home.streak.current')}
                                    </Text>
                                </Flex>
                            </Flex>
                            <Flex justify="space-between" align="end" gap={2}>
                                {weekDays.map((day, i) => (
                                    <Flex key={day.date} direction="column" align="center" gap={2} flex="1">
                                        <Box
                                            w="100%"
                                            maxW="30px"
                                            h={`${day.pagesRead > 0 ? Math.max(16, Math.round((day.pagesRead / maxWeekPages) * 42)) : 10}px`}
                                            minH="10px"
                                            borderRadius="sm"
                                            bg={day.pagesRead > 0 ? 'linear-gradient(180deg, rgba(197, 154, 92, 0.95) 0%, rgba(134, 95, 52, 0.95) 100%)' : 'rgba(248, 236, 214, 0.08)'}
                                            border="1px solid"
                                            borderColor={day.pagesRead > 0 ? 'rgba(217, 188, 146, 0.32)' : 'rgba(217, 188, 146, 0.08)'}
                                        />
                                        <Text fontSize="10px" color={mutedTextColor} fontWeight="600" textTransform="uppercase" letterSpacing="0.08em">
                                            {weekDayLabels[i]}
                                        </Text>
                                    </Flex>
                                ))}
                            </Flex>
                            <Text fontSize="xs" color={mutedTextColor} mt={3}>
                                {readingDaysThisWeek}/7 {t('home.streak.days')}
                            </Text>
                        </Box>

                        <Box {...panelStyles} p={5}>
                            <Text fontSize="0.68rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" fontWeight="700" mb={2}>
                                {t('home.restart.label')}
                            </Text>
                            <Heading size="md" color={textColor} mb={2} lineHeight="1.3">
                                {resumeSuggestion.kind === 'current'
                                    ? t('home.restart.currentTitle', { title: resumeSuggestion.title })
                                    : resumeSuggestion.kind === 'queued'
                                        ? t('home.restart.queuedTitle', { title: resumeSuggestion.title })
                                        : t('home.restart.emptyTitle')}
                            </Heading>
                            <Text color={subTextColor} fontSize="sm" lineHeight="1.8">
                                {resumeSuggestion.kind === 'current'
                                    ? t('home.restart.currentBody', { page: resumeSuggestion.currentPage })
                                    : resumeSuggestion.kind === 'queued'
                                        ? t('home.restart.queuedBody')
                                        : t('home.restart.emptyBody')}
                            </Text>
                        </Box>
                    </Stack>
                </GridItem>
            </Grid>

            <Grid templateColumns={{ base: '1fr', xl: '1.2fr 0.8fr' }} gap={6}>
                <GridItem>
                    <Box {...panelStyles} p={5} h="100%">
                        <Flex justify="space-between" align="flex-start" mb={4} gap={3}>
                            <Box>
                                <Text fontSize="0.68rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" fontWeight="700" mb={1}>
                                    {t('home.nextUp')}
                                </Text>
                                <Text color={subTextColor} fontSize="sm">
                                    {t('home.nextUpHint')}
                                </Text>
                            </Box>
                            <Button
                                as={RouterLink}
                                to={ROUTES.MY_BOOKS}
                                size="xs"
                                variant="ghost"
                                flexShrink={0}
                            >
                                {t('home.viewLibrary')}
                            </Button>
                        </Flex>

                        {queuedBooks.length === 0 ? (
                            <Text color={subTextColor} fontSize="sm">{t('home.queueEmpty')}</Text>
                        ) : (
                            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                                {queuedBooks.map((book) => (
                                    <Box
                                        key={book.id}
                                        as={RouterLink}
                                        to={ROUTES.BOOK_STATS(book.id)}
                                        {...insetStyles}
                                        p={4}
                                        _hover={{ bg: 'rgba(248, 236, 214, 0.06)', borderColor: borderColor, transform: 'translateY(-1px)' }}
                                        transition="all 0.2s"
                                    >
                                        <Text fontSize="0.66rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.14em" mb={2}>
                                            {t('home.continueReadingLabel')}
                                        </Text>
                                        <Heading size="md" color={textColor} mb={1} noOfLines={2}>
                                            {book.title}
                                        </Heading>
                                        <Text color={subTextColor} fontSize="sm" mb={3} noOfLines={1}>
                                            {book.authorName}
                                        </Text>
                                        <Text color={mutedTextColor} fontSize="xs">
                                            {book.currentPage || 0}
                                            {book.pageCount ? ` / ${book.pageCount} ${t('bookStats.pages')}` : ''}
                                        </Text>
                                    </Box>
                                ))}
                            </SimpleGrid>
                        )}
                    </Box>
                </GridItem>

                <GridItem>
                    <Box {...panelStyles} p={5} h="100%">
                        <Flex justify="space-between" align="flex-start" mb={4} gap={3}>
                            <Box>
                                <Text fontSize="0.68rem" color={mutedTextColor} textTransform="uppercase" letterSpacing="0.16em" fontWeight="700" mb={1}>
                                    {t('home.activeGoals')}
                                </Text>
                                <Text color={subTextColor} fontSize="sm">
                                    {t('home.goalSectionHint')}
                                </Text>
                            </Box>
                            <Button
                                as={RouterLink}
                                to={ROUTES.GOALS}
                                size="xs"
                                variant="ghost"
                                rightIcon={<FaForward />}
                                flexShrink={0}
                            >
                                {t('home.viewGoals')}
                            </Button>
                        </Flex>

                        {activeGoalBooks.length === 0 ? (
                            <Box
                                textAlign="center"
                                py={10}
                                {...insetStyles}
                                borderRadius="xl"
                                borderStyle="dashed"
                            >
                                <Icon as={FaBullseye} color={brandColor} boxSize={8} mb={3} />
                                <Text color={subTextColor} fontSize="sm">{t('home.noGoals')}</Text>
                            </Box>
                        ) : (
                            <Stack spacing={4}>
                                {activeGoalBooks.map((book, index) => (
                                    <GoalCard key={book.id} book={book} index={index} />
                                ))}
                            </Stack>
                        )}
                    </Box>
                </GridItem>
            </Grid>
        </Box>
    );
};

export default HomePage;
