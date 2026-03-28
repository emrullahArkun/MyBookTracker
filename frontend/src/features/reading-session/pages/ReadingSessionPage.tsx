import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Portal,
    Box,
    Container,
    Grid,
    GridItem,
    VStack,
    Spinner,
    Flex,
    Text,
} from '@chakra-ui/react';
import { useReadingSessionPageLogic } from '../model/useReadingSessionPageLogic';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

import SessionBookSidebar from '../ui/SessionBookSidebar';
import SessionCompletionOverlay from '../ui/SessionCompletionOverlay';
import SessionTimerCard from '../ui/SessionTimerCard';
import { ROUTES } from '../../../app/router/routes';

type AmbientMode = 'quiet' | 'warm' | 'night';

const AMBIENT_STYLES: Record<AmbientMode, { topGlow: string; bottomGlow: string }> = {
    quiet: {
        topGlow: 'radial-gradient(circle, rgba(149,161,127,0.18) 0%, rgba(149,161,127,0) 68%)',
        bottomGlow: 'radial-gradient(circle, rgba(197,154,92,0.14) 0%, rgba(197,154,92,0) 70%)',
    },
    warm: {
        topGlow: 'radial-gradient(circle, rgba(197,154,92,0.2) 0%, rgba(197,154,92,0) 68%)',
        bottomGlow: 'radial-gradient(circle, rgba(126,97,62,0.16) 0%, rgba(126,97,62,0) 70%)',
    },
    night: {
        topGlow: 'radial-gradient(circle, rgba(154,170,196,0.16) 0%, rgba(154,170,196,0) 68%)',
        bottomGlow: 'radial-gradient(circle, rgba(78,90,112,0.18) 0%, rgba(78,90,112,0) 70%)',
    },
};

const ReadingSessionPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [focusModeEnabled, setFocusModeEnabled] = useState(false);
    const [ambientMode, setAmbientMode] = useState<AmbientMode>('quiet');

    const {
        book,
        fetchingBook,
        sessionLoading,
        sessionPhase,
        isBusy,
        formattedTime,
        isPaused,
        resumeSession,
        pauseSession,
        isController,
        takeControl,
        showStopConfirm,
        endPage,
        setEndPage,
        handleStopClick,
        handleStopCancel,
        handleConfirmStop,
        completionSummary,
    } = useReadingSessionPageLogic(id);

    const { bgColor, cardBg, textColor, subTextColor, mutedTextColor, brandColor, borderColor, panelInsetBg, panelShadow } = useThemeTokens();
    const ambientStyle = AMBIENT_STYLES[ambientMode];

    useEffect(() => {
        if (!completionSummary) {
            return;
        }

        const timer = window.setTimeout(() => {
            navigate(ROUTES.MY_BOOKS);
        }, 3500);

        return () => window.clearTimeout(timer);
    }, [completionSummary, navigate]);

    if (fetchingBook || sessionLoading) {
        return (
            <Flex justify="center" align="center" h="100vh" bg={bgColor}>
                <Spinner size="xl" color={brandColor} thickness="4px" />
            </Flex>
        );
    }

    if (!book) {
        return <Box textAlign="center" py={20} color={textColor}>{t('bookStats.notFound')}</Box>;
    }

    return (
        <Box
            bg={bgColor}
            minH="calc(100vh - 60px)"
            px={{ base: 4, md: 8 }}
            pt={{ base: 4, md: 6 }}
            pb={5}
            overflow="hidden"
            display="flex"
            flexDirection="column"
            position="relative"
        >
            {completionSummary && (
                <Portal>
                    <SessionCompletionOverlay
                        summary={completionSummary}
                        pageCount={book.pageCount}
                    />
                </Portal>
            )}

            <Box
                position="absolute"
                top="-120px"
                right="-80px"
                w="360px"
                h="360px"
                borderRadius="full"
                bg={ambientStyle.topGlow}
                filter="blur(24px)"
                pointerEvents="none"
            />
            <Box
                position="absolute"
                bottom="-140px"
                left="-90px"
                w="420px"
                h="420px"
                borderRadius="full"
                bg={ambientStyle.bottomGlow}
                filter="blur(32px)"
                pointerEvents="none"
            />

            <Container
                maxW={focusModeEnabled ? '900px' : '1200px'}
                flex="1"
                minH="0"
                display="flex"
                flexDirection="column"
                position="relative"
                zIndex={1}
            >
                <Box mb={6}>
                    <Text fontSize="0.68rem" color={brandColor} textTransform="uppercase" letterSpacing="0.16em" fontWeight="700" mb={2}>
                        {t('readingSession.focusBadge')}
                    </Text>
                    <Text color={subTextColor} maxW="52ch" lineHeight="1.8" fontSize={{ base: 'md', md: 'lg' }}>
                        {focusModeEnabled ? t('readingSession.focusSubtitleDeep') : t('readingSession.focusSubtitle')}
                    </Text>
                </Box>

                <Grid templateColumns={{ base: "1fr", lg: focusModeEnabled ? "1fr" : "300px 1fr" }} gap={6} alignItems="start" flex="1" minH="0">
                    {!focusModeEnabled && (
                        <GridItem h="full" overflow="auto" css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                            <Box
                                bg={cardBg}
                                border="1px solid"
                                borderColor={borderColor}
                                borderRadius="2xl"
                                boxShadow={panelShadow}
                                p={1}
                            >
                                <SessionBookSidebar
                                    book={book}
                                    textColor={textColor}
                                    subTextColor={subTextColor}
                                />
                            </Box>
                        </GridItem>
                    )}

                    <GridItem w="full" h="full" overflow="auto" css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                        <VStack spacing={5} align="stretch">
                            <SessionTimerCard
                                cardBg={cardBg}
                                brandColor={brandColor}
                                sessionPhase={sessionPhase}
                                isBusy={isBusy}
                                isPaused={isPaused}
                                formattedTime={formattedTime}
                                isController={isController}
                                takeControl={takeControl}
                                showStopConfirm={showStopConfirm}
                                endPage={endPage}
                                setEndPage={setEndPage}
                                bookTitle={book.title}
                                authorName={book.authorName}
                                currentPageNumber={book.currentPage ?? 0}
                                pageCount={book.pageCount}
                                currentPage={String(book.currentPage ?? 0)}
                                subTextColor={subTextColor}
                                mutedTextColor={mutedTextColor}
                                borderColor={borderColor}
                                panelInsetBg={panelInsetBg}
                                focusModeEnabled={focusModeEnabled}
                                onToggleFocusMode={() => setFocusModeEnabled((currentValue) => !currentValue)}
                                ambientMode={ambientMode}
                                onAmbientModeChange={setAmbientMode}
                                handleConfirmStop={handleConfirmStop}
                                handleStopCancel={handleStopCancel}
                                resumeSession={resumeSession}
                                pauseSession={pauseSession}
                                handleStopClick={handleStopClick}
                            />
                        </VStack>
                    </GridItem>
                </Grid>

            </Container>
        </Box>
    );
};

export default ReadingSessionPage;
