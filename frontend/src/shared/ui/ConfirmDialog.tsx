import { useRef, type ReactElement } from 'react';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button,
    Icon,
    Flex,
    Text,
} from '@chakra-ui/react';
import { FaExclamationTriangle } from 'react-icons/fa';
import type { IconType } from 'react-icons';
import { useThemeTokens } from '../theme/useThemeTokens';

type ConfirmDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    body: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmColorScheme?: string;
    icon?: IconType;
    iconColor?: string;
};

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    body,
    confirmLabel,
    cancelLabel,
    confirmColorScheme = 'red',
    icon = FaExclamationTriangle,
    iconColor = 'red.300',
}: ConfirmDialogProps): ReactElement => {
    const cancelRef = useRef<HTMLButtonElement | null>(null);
    const {
        textColor,
        overlayBg,
        modalBg,
        modalBorder,
        modalSubtleBg,
        modalMutedText,
        modalShadow,
    } = useThemeTokens();
    const confirmBg = confirmColorScheme === 'red'
        ? 'linear-gradient(180deg, rgba(156, 79, 62, 0.96) 0%, rgba(114, 50, 41, 0.96) 100%)'
        : 'linear-gradient(180deg, rgba(243, 199, 133, 0.96) 0%, rgba(167, 127, 92, 0.94) 100%)';
    const confirmHoverBg = confirmColorScheme === 'red'
        ? 'linear-gradient(180deg, rgba(170, 89, 69, 0.98) 0%, rgba(128, 57, 46, 0.98) 100%)'
        : 'linear-gradient(180deg, rgba(249, 209, 148, 0.98) 0%, rgba(182, 138, 101, 0.96) 100%)';

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
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
                                <Icon as={icon} boxSize={6} color={iconColor} />
                            </Flex>
                        </Flex>
                        <Text fontSize="lg" fontWeight="700" color={textColor}>
                            {title}
                        </Text>
                    </AlertDialogHeader>
                    <AlertDialogBody textAlign="center" py={3}>
                        <Text fontSize="sm" color={modalMutedText}>
                            {body}
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter justifyContent="center" gap={3} pb={8} pt={3}>
                        <Button
                            ref={cancelRef}
                            onClick={onClose}
                            bg={modalSubtleBg}
                            color={modalMutedText}
                            border="1px solid"
                            borderColor={modalBorder}
                            borderRadius="xl"
                            px={6}
                            _hover={{ bg: 'rgba(255, 248, 239, 0.12)', color: textColor }}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            onClick={onConfirm}
                            borderRadius="xl"
                            px={6}
                            color="#fff8ef"
                            bg={confirmBg}
                            _hover={{ bg: confirmHoverBg, transform: 'translateY(-1px)' }}
                            boxShadow="0 16px 30px rgba(8, 12, 20, 0.24)"
                        >
                            {confirmLabel}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

export default ConfirmDialog;
