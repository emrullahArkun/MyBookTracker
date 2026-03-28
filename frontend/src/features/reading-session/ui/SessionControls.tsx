import { Button, HStack } from '@chakra-ui/react';
import { FaPause, FaPlay, FaStop } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

type SessionControlsProps = {
    isPaused: boolean;
    resumeSession: () => Promise<void>;
    pauseSession: () => Promise<void>;
    handleStopClick: () => void;
    isController: boolean;
    isBusy: boolean;
};

function SessionControls({
    isPaused,
    resumeSession,
    pauseSession,
    handleStopClick,
    isController,
    isBusy,
}: SessionControlsProps) {
    const { t } = useTranslation();

    return (
        <HStack spacing={4} pt={2} flexWrap={{ base: 'wrap', md: 'nowrap' }} justify="center">
            {isPaused ? (
                <Button
                    size="lg"
                    w={{ base: '100%', md: '160px' }}
                    h="56px"
                    leftIcon={<FaPlay />}
                    onClick={resumeSession}
                    isDisabled={!isController || isBusy}
                    isLoading={isBusy}
                    fontSize="md"
                    _hover={{ transform: 'translateY(-1px)' }}
                    transition="all 0.15s"
                >
                    {t('readingSession.controls.resume')}
                </Button>
            ) : (
                <Button
                    size="lg"
                    bg="#95a17f"
                    color="#18120f"
                    w={{ base: '100%', md: '160px' }}
                    h="56px"
                    leftIcon={<FaPause />}
                    onClick={pauseSession}
                    isDisabled={!isController || isBusy}
                    isLoading={isBusy}
                    fontSize="md"
                    _hover={{ transform: 'translateY(-1px)', bg: '#a9b695' }}
                    transition="all 0.15s"
                >
                    {t('readingSession.controls.pause')}
                </Button>
            )}

            <Button
                size="lg"
                variant="outline"
                w={{ base: '100%', md: '160px' }}
                h="56px"
                leftIcon={<FaStop />}
                onClick={handleStopClick}
                isDisabled={!isController || isBusy}
                isLoading={isBusy}
                color="#f2b09e"
                borderColor="rgba(207, 109, 88, 0.3)"
                _hover={{ bg: 'rgba(207, 109, 88, 0.08)', borderColor: 'rgba(207, 109, 88, 0.4)' }}
                fontSize="md"
            >
                {t('readingSession.controls.stop')}
            </Button>
        </HStack>
    );
}

export default SessionControls;
