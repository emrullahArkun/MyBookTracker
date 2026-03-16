import {
    Box,
    Button,
    VStack,
    HStack,
    Text,
    Icon,
    Alert,
    AlertIcon,
    FormControl,
    FormLabel,
    Input,
    Card
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaPlay, FaPause, FaStop, FaBookOpen, FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const MotionCard = motion(Card);
const MotionBox = motion(Box);

const SessionTimerCard = ({
    cardBg,
    brandColor,
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
}) => {
    const { t } = useTranslation();

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
                <HStack align="center" color={brandColor} spacing={2}>
                    <Icon as={FaBookOpen} boxSize={3.5} />
                    <Text fontWeight="600" letterSpacing="wider" textTransform="uppercase" fontSize="xs">
                        {t('readingSession.activeSession')}
                    </Text>
                </HStack>

                <Box>
                    <Text
                        fontSize={{ base: "6xl", md: "8xl" }}
                        fontWeight="bold"
                        fontFamily="monospace"
                        color={isPaused ? "gray.500" : "white"}
                        lineHeight="1"
                    >
                        {formattedTime}
                    </Text>
                    <Text
                        color={isPaused ? "orange.300" : "gray.500"}
                        mt={2}
                        fontWeight="500"
                        fontSize="sm"
                        letterSpacing="wide"
                    >
                        {isPaused ? t('readingSession.paused') : t('readingSession.readingPrompt')}
                    </Text>
                </Box>

                {!isController && (
                    <RemoteAlert t={t} takeControl={takeControl} />
                )}

                {showStopConfirm ? (
                    <StopConfirm
                        t={t}
                        subTextColor={subTextColor}
                        endPage={endPage}
                        setEndPage={setEndPage}
                        currentPage={currentPage}
                        handleConfirmStop={handleConfirmStop}
                        handleStopCancel={handleStopCancel}
                    />
                ) : (
                    <Controls
                        t={t}
                        isPaused={isPaused}
                        resumeSession={resumeSession}
                        pauseSession={pauseSession}
                        handleStopClick={handleStopClick}
                        isController={isController}
                    />
                )}
            </VStack>
        </MotionCard>
    );
};

const RemoteAlert = ({ t, takeControl }) => (
    <Alert status="warning" borderRadius="md" variant="solid" bg="orange.500">
        <AlertIcon />
        <Box flex="1">
            <Text fontWeight="bold">{t('readingSession.remote.title')}</Text>
            <Text fontSize="sm">{t('readingSession.remote.desc')}</Text>
        </Box>
        <Button colorScheme="whiteAlpha" size="sm" onClick={takeControl}>
            {t('readingSession.remote.takeControl')}
        </Button>
    </Alert>
);

const StopConfirm = ({ t, subTextColor, endPage, setEndPage, currentPage, handleConfirmStop, handleStopCancel }) => (
    <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        w="full"
        maxW="sm"
        bg="whiteAlpha.100"
        p={5}
        borderRadius="xl"
    >
        <VStack spacing={4}>
            <Text color="white" fontWeight="600" fontSize="md">{t('readingSession.finish.title')}</Text>
            <FormControl>
                <FormLabel color={subTextColor} fontSize="sm">{t('readingSession.finish.endPage')}</FormLabel>
                <Input
                    type="number"
                    value={endPage}
                    onChange={(e) => setEndPage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmStop(); }}
                    placeholder={currentPage}
                    bg="whiteAlpha.100"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    color="white"
                    _focus={{ borderColor: "teal.400", boxShadow: "none" }}
                    autoFocus
                />
            </FormControl>
            <HStack spacing={3} w="full">
                <Button flex={1} size="sm" colorScheme="teal" onClick={handleConfirmStop} leftIcon={<FaCheck />}>
                    {t('readingSession.controls.save')}
                </Button>
                <Button flex={1} size="sm" variant="ghost" color="gray.400" onClick={handleStopCancel}
                    _hover={{ color: 'white', bg: 'whiteAlpha.100' }}>
                    {t('readingSession.controls.cancel')}
                </Button>
            </HStack>
        </VStack>
    </MotionBox>
);

const Controls = ({ t, isPaused, resumeSession, pauseSession, handleStopClick, isController }) => (
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
                isDisabled={!isController}
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
                isDisabled={!isController}
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
            isDisabled={!isController}
            color="red.300"
            borderColor="whiteAlpha.200"
            _hover={{ bg: 'whiteAlpha.100', borderColor: 'red.400' }}
            fontSize="md"
        >
            {t('readingSession.controls.stop')}
        </Button>
    </HStack>
);

export default SessionTimerCard;
