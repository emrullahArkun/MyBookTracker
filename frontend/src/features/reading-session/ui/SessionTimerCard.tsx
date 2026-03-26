import {
    Card,
    VStack,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import type { ReadingSessionPhase } from '../../../shared/types/sessions';
import SessionControls from './SessionControls';
import SessionRemoteAlert from './SessionRemoteAlert';
import SessionStatusDisplay from './SessionStatusDisplay';
import SessionStopConfirm from './SessionStopConfirm';

const MotionCard = motion(Card);

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
    currentPage: string;
    subTextColor: string;
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
    currentPage,
    subTextColor,
    handleConfirmStop,
    handleStopCancel,
    resumeSession,
    pauseSession,
    handleStopClick
}: SessionTimerCardProps) => {
    return (
        <MotionCard
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor="whiteAlpha.100"
            boxShadow="none"
            p={8}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <VStack spacing={6} textAlign="center">
                <SessionStatusDisplay
                    brandColor={brandColor}
                    formattedTime={formattedTime}
                    isPaused={isPaused}
                    isBusy={isBusy}
                    sessionPhase={sessionPhase}
                />

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
