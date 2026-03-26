import { Box, Button, FormControl, FormLabel, HStack, Input, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import type { ChangeEvent, KeyboardEvent } from 'react';

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

    return (
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
                        onChange={(event: ChangeEvent<HTMLInputElement>) => setEndPage(event.target.value)}
                        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                            if (event.key === 'Enter') {
                                void handleConfirmStop();
                            }
                        }}
                        placeholder={currentPage}
                        bg="whiteAlpha.100"
                        border="1px solid"
                        borderColor="whiteAlpha.200"
                        color="white"
                        _focus={{ borderColor: 'teal.400', boxShadow: 'none' }}
                        autoFocus
                    />
                </FormControl>
                <HStack spacing={3} w="full">
                    <Button flex={1} size="sm" colorScheme="teal" onClick={handleConfirmStop} leftIcon={<FaCheck />}>
                        {t('readingSession.controls.save')}
                    </Button>
                    <Button
                        flex={1}
                        size="sm"
                        variant="ghost"
                        color="gray.400"
                        onClick={handleStopCancel}
                        _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
                    >
                        {t('readingSession.controls.cancel')}
                    </Button>
                </HStack>
            </VStack>
        </MotionBox>
    );
}

export default SessionStopConfirm;
