import {
    Badge,
    Box,
    Button,
    ButtonGroup,
    Card,
    Flex,
    SimpleGrid,
    Text,
    VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { ReadingSessionPhase } from '../../../shared/types/sessions';
import { useTranslation } from 'react-i18next';
import SessionControls from './SessionControls';
import SessionRemoteAlert from './SessionRemoteAlert';
import SessionStatusDisplay from './SessionStatusDisplay';
import SessionStopConfirm from './SessionStopConfirm';

const MotionCard = motion(Card);
const MotionGlow = motion(Box);

type SessionTimerCardProps = {
    cardBg: string;
    brandColor: string;
    sessionPhase: ReadingSessionPhase;
    isBusy: boolean;
    isPaused: boolean;
    formattedTime: string;
    isController: boolean;
    takeControl: () => void;
    showStopConfirm: boolean;
    endPage: string;
    setEndPage: (value: string) => void;
    bookTitle: string;
    authorName: string;
    currentPageNumber: number;
    pageCount: number | null;
    currentPage: string;
    subTextColor: string;
    mutedTextColor: string;
    borderColor: string;
    panelInsetBg: string;
    focusModeEnabled: boolean;
    onToggleFocusMode: () => void;
    ambientMode: 'quiet' | 'warm' | 'night';
    onAmbientModeChange: (mode: 'quiet' | 'warm' | 'night') => void;
    handleConfirmStop: () => Promise<void>;
    handleStopCancel: () => void;
    resumeSession: () => Promise<void>;
    pauseSession: () => Promise<void>;
    handleStopClick: () => void;
};

const SessionTimerCard = ({
    cardBg,
    brandColor,
    sessionPhase,
    isBusy,
    isPaused,
    formattedTime,
    isController,
    takeControl,
    showStopConfirm,
    endPage,
    setEndPage,
    bookTitle,
    authorName,
    currentPageNumber,
    pageCount,
    currentPage,
    subTextColor,
    mutedTextColor,
    borderColor,
    panelInsetBg,
    focusModeEnabled,
    onToggleFocusMode,
    ambientMode,
    onAmbientModeChange,
    handleConfirmStop,
    handleStopCancel,
    resumeSession,
    pauseSession,
    handleStopClick
}: SessionTimerCardProps) => {
    const { t } = useTranslation();
    const progressPercent = pageCount ? Math.round((currentPageNumber / pageCount) * 100) : 0;
    const pagesLeft = pageCount ? Math.max(pageCount - currentPageNumber, 0) : null;

    const getAmbientCopy = () => {
        if (isPaused) {
            return t('readingSession.ambience.paused');
        }

        if (ambientMode === 'warm') {
            return t('readingSession.ambience.warm', { title: bookTitle });
        }

        if (ambientMode === 'night') {
            return t('readingSession.ambience.night', { title: bookTitle });
        }

        return t('readingSession.ambience.quiet', { title: bookTitle });
    };

    return (
        <MotionCard
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={borderColor}
            boxShadow="0 24px 42px rgba(8, 6, 4, 0.22)"
            p={8}
            position="relative"
            overflow="hidden"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.12 }}
        >
            <MotionGlow
                position="absolute"
                top="-90px"
                left="50%"
                transform="translateX(-50%)"
                w={{ base: '220px', md: '300px' }}
                h={{ base: '220px', md: '300px' }}
                borderRadius="full"
                bg="radial-gradient(circle, rgba(197,154,92,0.16) 0%, rgba(197,154,92,0) 68%)"
                animate={{ scale: [0.96, 1.03, 0.96], opacity: [0.55, 0.9, 0.55] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                pointerEvents="none"
            />

            <VStack spacing={7} textAlign="center" position="relative" zIndex={1}>
                <Flex w="full" justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} direction={{ base: 'column', md: 'row' }}>
                    <VStack spacing={3} align={{ base: 'start', md: 'center' }}>
                        <Badge bg="rgba(197, 154, 92, 0.12)" color="#d9bc92">
                            {t('readingSession.focusMode')}
                        </Badge>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onToggleFocusMode}
                        >
                            {focusModeEnabled ? t('readingSession.controls.showContext') : t('readingSession.controls.enterFocus')}
                        </Button>
                    </VStack>

                    <ButtonGroup isAttached size="sm" variant="outline" alignSelf={{ base: 'stretch', md: 'center' }}>
                        {(['quiet', 'warm', 'night'] as const).map((mode) => (
                            <Button
                                key={mode}
                                onClick={() => onAmbientModeChange(mode)}
                                borderColor={ambientMode === mode ? '#c59a5c' : borderColor}
                                bg={ambientMode === mode ? 'rgba(197, 154, 92, 0.12)' : 'transparent'}
                                color={ambientMode === mode ? '#f4ead7' : 'rgba(217, 204, 182, 0.76)'}
                                _hover={{ bg: 'rgba(248, 236, 214, 0.05)' }}
                            >
                                {t(`readingSession.ambientModes.${mode}`)}
                            </Button>
                        ))}
                    </ButtonGroup>
                </Flex>

                <VStack spacing={3}>
                    <Text color={subTextColor} fontSize="sm" maxW="42ch" lineHeight="1.8">
                        {getAmbientCopy()}
                    </Text>
                </VStack>

                <Box w="full" bg={panelInsetBg} borderRadius="2xl" p={{ base: 5, md: 6 }} border="1px solid" borderColor={borderColor}>
                    <SessionStatusDisplay
                        brandColor={brandColor}
                        formattedTime={formattedTime}
                        isPaused={isPaused}
                        isBusy={isBusy}
                        sessionPhase={sessionPhase}
                    />
                </Box>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3} w="full">
                    <Box bg={panelInsetBg} borderRadius="xl" p={4} border="1px solid" borderColor={borderColor}>
                        <Text color={mutedTextColor} fontSize="0.68rem" textTransform="uppercase" letterSpacing="0.14em" mb={1}>
                            {t('readingSession.metrics.currentPage')}
                        </Text>
                        <Text color={brandColor} fontSize="2.2rem" fontWeight="700" fontFamily="heading" lineHeight="1">
                            {currentPageNumber}
                        </Text>
                    </Box>
                    <Box bg={panelInsetBg} borderRadius="xl" p={4} border="1px solid" borderColor={borderColor}>
                        <Text color={mutedTextColor} fontSize="0.68rem" textTransform="uppercase" letterSpacing="0.14em" mb={1}>
                            {t('readingSession.metrics.pagesLeft')}
                        </Text>
                        <Text color="#95a17f" fontSize="2.2rem" fontWeight="700" fontFamily="heading" lineHeight="1">
                            {pagesLeft ?? '—'}
                        </Text>
                    </Box>
                    <Box bg={panelInsetBg} borderRadius="xl" p={4} border="1px solid" borderColor={borderColor}>
                        <Text color={mutedTextColor} fontSize="0.68rem" textTransform="uppercase" letterSpacing="0.14em" mb={1}>
                            {t('readingSession.metrics.progress')}
                        </Text>
                        <Text color="#f4ead7" fontSize="2.2rem" fontWeight="700" fontFamily="heading" lineHeight="1">
                            {pageCount ? `${progressPercent}%` : '—'}
                        </Text>
                    </Box>
                </SimpleGrid>

                <Box w="full" bg={panelInsetBg} borderRadius="xl" p={4} border="1px solid" borderColor={borderColor}>
                    <Text color="#f4ead7" fontWeight="600" mb={1} fontFamily="heading" fontSize="xl">
                        {bookTitle}
                    </Text>
                    <Text color={subTextColor} fontSize="sm">
                        {focusModeEnabled
                            ? t('readingSession.focusModeHint')
                            : t('readingSession.cozyLine', { author: authorName })}
                    </Text>
                </Box>

                {!isController && (
                    <SessionRemoteAlert takeControl={takeControl} />
                )}

                {showStopConfirm ? (
                    <SessionStopConfirm
                        subTextColor={subTextColor}
                        endPage={endPage}
                        setEndPage={setEndPage}
                        currentPage={currentPage}
                        handleConfirmStop={handleConfirmStop}
                        handleStopCancel={handleStopCancel}
                    />
                ) : (
                    <SessionControls
                        isPaused={isPaused}
                        resumeSession={resumeSession}
                        pauseSession={pauseSession}
                        handleStopClick={handleStopClick}
                        isController={isController}
                        isBusy={isBusy}
                    />
                )}
            </VStack>
        </MotionCard>
    );
};

export default SessionTimerCard;
