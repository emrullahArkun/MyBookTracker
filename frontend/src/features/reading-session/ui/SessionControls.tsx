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
        <HStack spacing={4} pt={2}>
            {isPaused ? (
                <Button
                    size="lg"
                    colorScheme="teal"
                    borderRadius="xl"
                    w="150px"
                    h="56px"
                    leftIcon={<FaPlay />}
                    onClick={resumeSession}
                    isDisabled={!isController || isBusy}
                    isLoading={isBusy}
                    fontSize="md"
                    _hover={{ transform: 'scale(1.03)' }}
                    transition="all 0.15s"
                >
                    {t('readingSession.controls.resume')}
                </Button>
            ) : (
                <Button
                    size="lg"
                    colorScheme="orange"
                    borderRadius="xl"
                    w="150px"
                    h="56px"
                    leftIcon={<FaPause />}
                    onClick={pauseSession}
                    isDisabled={!isController || isBusy}
                    isLoading={isBusy}
                    fontSize="md"
                    _hover={{ transform: 'scale(1.03)' }}
                    transition="all 0.15s"
                >
                    {t('readingSession.controls.pause')}
                </Button>
            )}

            <Button
                size="lg"
                variant="outline"
                borderRadius="xl"
                w="150px"
                h="56px"
                leftIcon={<FaStop />}
                onClick={handleStopClick}
                isDisabled={!isController || isBusy}
                isLoading={isBusy}
                color="red.300"
                borderColor="whiteAlpha.200"
                _hover={{ bg: 'whiteAlpha.100', borderColor: 'red.400' }}
                fontSize="md"
            >
                {t('readingSession.controls.stop')}
            </Button>
        </HStack>
    );
}

export default SessionControls;
