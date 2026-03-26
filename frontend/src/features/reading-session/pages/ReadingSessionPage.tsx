import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Container,
    Grid,
    GridItem,
    VStack,
    Spinner,
    Flex
} from '@chakra-ui/react';
import { useReadingSessionPageLogic } from '../model/useReadingSessionPageLogic';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

import SessionBookSidebar from '../ui/SessionBookSidebar';
import SessionTimerCard from '../ui/SessionTimerCard';

const ReadingSessionPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();

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
        handleConfirmStop
    } = useReadingSessionPageLogic(id);

    const { bgColor, cardBg, textColor, subTextColor, brandColor } = useThemeTokens();

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
        <Box bg={bgColor} h="calc(100vh - 60px)" px={{ base: 4, md: 8 }} pt={5} pb={5} overflow="hidden" display="flex" flexDirection="column">
            <Container maxW="container.xl" flex="1" minH="0" display="flex" flexDirection="column">
                <Grid templateColumns={{ base: "1fr", lg: "280px 1fr" }} gap={6} alignItems="start" flex="1" minH="0">
                    <GridItem h="full" overflow="auto" css={{ '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
                        <SessionBookSidebar
                            book={book}
                            cardBg={cardBg}
                            textColor={textColor}
                            subTextColor={subTextColor}
                        />
                    </GridItem>

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
                                currentPage={String(book.currentPage ?? 0)}
                                subTextColor={subTextColor}
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
