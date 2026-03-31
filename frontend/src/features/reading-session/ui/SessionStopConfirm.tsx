import { useEffect, useRef } from 'react';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    Flex,
    FormControl,
    FormLabel,
    Icon,
    Input,
    Text,
} from '@chakra-ui/react';
import { FaBookOpen } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

type SessionStopConfirmProps = {
    endPage: string;
    setEndPage: (value: string) => void;
    currentPage: string;
    handleConfirmStop: () => Promise<void>;
    handleStopCancel: () => void;
};

function SessionStopConfirm({
    endPage,
    setEndPage,
    currentPage,
    handleConfirmStop,
    handleStopCancel,
}: SessionStopConfirmProps) {
    const { t } = useTranslation();
    const cancelRef = useRef<HTMLButtonElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);
    const {
        textColor,
        overlayBg,
        modalBg,
        modalBorder,
        modalSubtleBg,
        modalMutedText,
        modalShadow,
        brandColor,
    } = useThemeTokens();

    useEffect(() => {
        const focusHandle = window.requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        });

        return () => window.cancelAnimationFrame(focusHandle);
    }, []);

    return (
        <AlertDialog
            isOpen
            leastDestructiveRef={cancelRef}
            onClose={handleStopCancel}
            isCentered
        >
            <AlertDialogOverlay bg={overlayBg} backdropFilter="blur(10px)">
                <AlertDialogContent
                    bg={modalBg}
                    border="1px solid"
                    borderColor={modalBorder}
                    borderRadius="2xl"
                    mx={4}
                    boxShadow={modalShadow}
                    color={textColor}
                    overflow="hidden"
                >
                    <AlertDialogHeader pt={8} pb={0} textAlign="center">
                        <Flex justify="center" mb={4}>
                            <Flex
                                w={14}
                                h={14}
                                borderRadius="full"
                                bg={modalSubtleBg}
                                align="center"
                                justify="center"
                                border="1px solid"
                                borderColor={modalBorder}
                                boxShadow="0 0 24px rgba(243, 199, 133, 0.16)"
                            >
                                <Icon as={FaBookOpen} boxSize={6} color={brandColor} />
                            </Flex>
                        </Flex>
                        <Text fontSize="lg" fontWeight="700" color={textColor}>
                            {t('readingSession.finish.title')}
                        </Text>
                    </AlertDialogHeader>

                    <AlertDialogBody py={5}>
                        <FormControl>
                            <FormLabel color={modalMutedText} fontSize="sm">
                                {t('readingSession.finish.endPage')}
                            </FormLabel>
                            <Input
                                ref={inputRef}
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
                                borderRadius="xl"
                                color={textColor}
                                _placeholder={{ color: modalMutedText }}
                                _focus={{ borderColor: brandColor, boxShadow: `0 0 0 1px ${brandColor}` }}
                                autoFocus
                            />
                        </FormControl>
                    </AlertDialogBody>

                    <AlertDialogFooter justifyContent="center" gap={3} pb={8} pt={3}>
                        <Button
                            ref={cancelRef}
                            onClick={handleStopCancel}
                            bg={modalSubtleBg}
                            color={modalMutedText}
                            border="1px solid"
                            borderColor={modalBorder}
                            borderRadius="xl"
                            px={6}
                            _hover={{ bg: 'rgba(255, 248, 239, 0.12)', color: textColor }}
                        >
                            {t('readingSession.controls.cancel')}
                        </Button>
                        <Button
                            onClick={handleConfirmStop}
                            borderRadius="xl"
                            px={6}
                            color="#fff8ef"
                            bg="linear-gradient(180deg, rgba(243, 199, 133, 0.96) 0%, rgba(167, 127, 92, 0.94) 100%)"
                            _hover={{
                                bg: 'linear-gradient(180deg, rgba(249, 209, 148, 0.98) 0%, rgba(182, 138, 101, 0.96) 100%)',
                                transform: 'translateY(-1px)',
                            }}
                            boxShadow="0 16px 30px rgba(8, 12, 20, 0.24)"
                        >
                            {t('readingSession.controls.save')}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
}

export default SessionStopConfirm;
