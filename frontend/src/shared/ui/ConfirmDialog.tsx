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

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
            isCentered
        >
            <AlertDialogOverlay bg="blackAlpha.700" backdropFilter="blur(4px)">
                <AlertDialogContent
                    bg="gray.900"
                    border="1px solid"
                    borderColor="whiteAlpha.100"
                    borderRadius="2xl"
                    mx={4}
                >
                    <AlertDialogHeader pt={8} pb={0} textAlign="center">
                        <Flex justify="center" mb={4}>
                            <Flex w={14} h={14} borderRadius="full" bg="whiteAlpha.100" align="center" justify="center">
                                <Icon as={icon} boxSize={6} color={iconColor} />
                            </Flex>
                        </Flex>
                        <Text fontSize="lg" fontWeight="700" color="white">
                            {title}
                        </Text>
                    </AlertDialogHeader>
                    <AlertDialogBody textAlign="center" py={3}>
                        <Text fontSize="sm" color="gray.400">
                            {body}
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter justifyContent="center" gap={3} pb={8} pt={3}>
                        <Button
                            ref={cancelRef}
                            onClick={onClose}
                            bg="whiteAlpha.100"
                            color="gray.300"
                            border="1px solid"
                            borderColor="whiteAlpha.200"
                            borderRadius="xl"
                            px={6}
                            _hover={{ bg: 'whiteAlpha.200' }}
                        >
                            {cancelLabel}
                        </Button>
                        <Button
                            colorScheme={confirmColorScheme}
                            onClick={onConfirm}
                            borderRadius="xl"
                            px={6}
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
