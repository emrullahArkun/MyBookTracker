import { Box, Button, FormControl, FormLabel, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

const MotionBox = motion(Box);

type SessionStopConfirmProps = {
    subTextColor: string;
    endPage: string;
    setEndPage: (value: string) => void;
    currentPage: string;
    handleConfirmStop: () => Promise<void>;
    handleStopCancel: () => void;
};

function SessionStopConfirm({
    subTextColor,
    endPage,
    setEndPage,
    currentPage,
    handleConfirmStop,
    handleStopCancel,
}: SessionStopConfirmProps) {
    const { t } = useTranslation();
    const { textColor, modalBorder, modalSubtleBg, modalMutedText, brandColor } = useThemeTokens();

    return (
        <MotionBox
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            w="full"
            maxW="sm"
            bg="linear-gradient(180deg, rgba(24, 34, 52, 0.94) 0%, rgba(53, 40, 32, 0.92) 100%)"
            p={5}
            borderRadius="xl"
            border="1px solid"
            borderColor={modalBorder}
            boxShadow="0 22px 40px rgba(8, 12, 20, 0.28)"
        >
            <VStack spacing={4}>
                <Text color={textColor} fontWeight="600" fontSize="md">{t('readingSession.finish.title')}</Text>
                <FormControl>
                    <FormLabel color={subTextColor} fontSize="sm">{t('readingSession.finish.endPage')}</FormLabel>
                    <Input
                        type="number"
                        value={endPage}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setEndPage(event.target.value)}
                        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                            if (event.key === 'Enter') {
                                void handleConfirmStop();
                            }
                        }}
                        placeholder={currentPage}
                        bg={modalSubtleBg}
                        border="1px solid"
                        borderColor={modalBorder}
                        color={textColor}
                        _placeholder={{ color: modalMutedText }}
                        _focus={{ borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` }}
                        autoFocus
                    />
                </FormControl>
                <HStack spacing={3} w="full">
                    <Button
                        flex={1}
                        size="sm"
                        onClick={handleConfirmStop}
                        leftIcon={<FaCheck />}
                        color="#fff8ef"
                        bg="linear-gradient(180deg, rgba(243, 199, 133, 0.96) 0%, rgba(167, 127, 92, 0.94) 100%)"
                        _hover={{
                            bg: 'linear-gradient(180deg, rgba(249, 209, 148, 0.98) 0%, rgba(182, 138, 101, 0.96) 100%)',
                            transform: 'translateY(-1px)',
                        }}
                    >
                        {t('readingSession.controls.save')}
                    </Button>
                    <Button
                        flex={1}
                        size="sm"
                        bg={modalSubtleBg}
                        color={modalMutedText}
                        border="1px solid"
                        borderColor={modalBorder}
                        onClick={handleStopCancel}
                        _hover={{ color: textColor, bg: 'rgba(255, 248, 239, 0.12)' }}
                    >
                        {t('readingSession.controls.cancel')}
                    </Button>
                </HStack>
            </VStack>
        </MotionBox>
    );
}

export default SessionStopConfirm;
