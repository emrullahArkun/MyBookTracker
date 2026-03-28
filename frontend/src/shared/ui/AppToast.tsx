import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import type { UseToastOptions } from '@chakra-ui/react';
import type { IconType } from 'react-icons';

type AppToastStatus = 'success' | 'error' | 'warning' | 'info';

type CreateAppToastOptions = {
    id?: string;
    title: string;
    description?: string;
    status?: AppToastStatus;
    duration?: number;
    position?: UseToastOptions['position'];
    isClosable?: boolean;
};

type ToastPalette = {
    icon: IconType;
    iconColor: string;
    glow: string;
};

const APP_TOAST_CONTAINER_STYLE = { marginTop: '84px' };

const TOAST_PALETTES: Record<AppToastStatus, ToastPalette> = {
    success: {
        icon: FaCheckCircle,
        iconColor: '#9ad0a6',
        glow: 'rgba(154, 208, 166, 0.28)',
    },
    error: {
        icon: FaTimesCircle,
        iconColor: '#f2a38d',
        glow: 'rgba(242, 163, 141, 0.28)',
    },
    warning: {
        icon: FaExclamationTriangle,
        iconColor: '#f3c785',
        glow: 'rgba(243, 199, 133, 0.28)',
    },
    info: {
        icon: FaInfoCircle,
        iconColor: '#9db6df',
        glow: 'rgba(157, 182, 223, 0.28)',
    },
};

type AppToastMessageProps = {
    title: string;
    description?: string;
    status: AppToastStatus;
};

const AppToastMessage = ({ title, description, status }: AppToastMessageProps) => {
    const palette = TOAST_PALETTES[status];

    return (
        <Box
            minW={{ base: 'calc(100vw - 32px)', sm: '360px' }}
            maxW="460px"
            mx="auto"
            px={4}
        >
            <Flex
                align="flex-start"
                gap={3}
                px={4}
                py={3.5}
                borderRadius="20px"
                bg="linear-gradient(180deg, rgba(23, 33, 50, 0.96) 0%, rgba(55, 41, 33, 0.94) 100%)"
                border="1px solid"
                borderColor="rgba(255, 238, 214, 0.12)"
                boxShadow="0 18px 40px rgba(8, 12, 20, 0.34), inset 0 1px 0 rgba(255, 244, 232, 0.06)"
                color="#fff8ef"
            >
                <Flex
                    w={10}
                    h={10}
                    flexShrink={0}
                    align="center"
                    justify="center"
                    borderRadius="full"
                    bg="rgba(255, 248, 239, 0.08)"
                    boxShadow={`0 0 20px ${palette.glow}`}
                >
                    <Icon as={palette.icon} color={palette.iconColor} boxSize={4.5} />
                </Flex>
                <Box>
                    <Text fontSize="sm" fontWeight="700" lineHeight="1.4">
                        {title}
                    </Text>
                    {description ? (
                        <Text mt={1} fontSize="xs" color="rgba(240, 229, 214, 0.74)" lineHeight="1.5">
                            {description}
                        </Text>
                    ) : null}
                </Box>
            </Flex>
        </Box>
    );
};

export const createAppToast = ({
    id,
    title,
    description,
    status = 'info',
    duration = 4000,
    position = 'top',
    isClosable = true,
}: CreateAppToastOptions): UseToastOptions => ({
    id,
    duration,
    position,
    isClosable,
    containerStyle: APP_TOAST_CONTAINER_STYLE,
    render: () => (
        <AppToastMessage
            title={title}
            description={description}
            status={status}
        />
    ),
});

export const showAppToast = (
    toast: (options?: UseToastOptions) => void,
    options: CreateAppToastOptions
) => {
    toast(createAppToast(options));
};
