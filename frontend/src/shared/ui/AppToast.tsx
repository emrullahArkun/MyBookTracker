import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimesCircle } from 'react-icons/fa';
import type { UseToastOptions } from '@chakra-ui/react';
import type { IconType } from 'react-icons';
import { useThemeTokens } from '../theme/useThemeTokens';

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
    iconBg: string;
};

const APP_TOAST_CONTAINER_STYLE = { marginTop: '84px' };

const TOAST_PALETTES: Record<AppToastStatus, ToastPalette> = {
    success: {
        icon: FaCheckCircle,
        iconColor: '#a8c992',
        glow: 'rgba(168, 201, 146, 0.24)',
        iconBg: 'rgba(168, 201, 146, 0.12)',
    },
    error: {
        icon: FaTimesCircle,
        iconColor: '#de9d86',
        glow: 'rgba(222, 157, 134, 0.24)',
        iconBg: 'rgba(222, 157, 134, 0.12)',
    },
    warning: {
        icon: FaExclamationTriangle,
        iconColor: '#d8b179',
        glow: 'rgba(216, 177, 121, 0.24)',
        iconBg: 'rgba(216, 177, 121, 0.12)',
    },
    info: {
        icon: FaInfoCircle,
        iconColor: '#d8ba8c',
        glow: 'rgba(216, 186, 140, 0.24)',
        iconBg: 'rgba(216, 186, 140, 0.12)',
    },
};

type AppToastMessageProps = {
    title: string;
    description?: string;
    status: AppToastStatus;
};

const AppToastMessage = ({ title, description, status }: AppToastMessageProps) => {
    const palette = TOAST_PALETTES[status];
    const {
        modalBg,
        modalBorder,
        modalShadow,
        textColor,
        modalMutedText,
    } = useThemeTokens();

    return (
        <Box
            minW={{ base: 'calc(100vw - 32px)', sm: '360px' }}
            maxW="460px"
            mx="auto"
            px={4}
        >
            <Flex
                align="center"
                gap={3}
                px={4}
                py={3.5}
                borderRadius="20px"
                bg={modalBg}
                border="1px solid"
                borderColor={modalBorder}
                boxShadow={`${modalShadow}, inset 0 1px 0 rgba(255, 244, 232, 0.04)`}
                color={textColor}
            >
                <Flex
                    w={12}
                    h={12}
                    flexShrink={0}
                    align="center"
                    justify="center"
                    borderRadius="full"
                    bg={`linear-gradient(180deg, rgba(255, 248, 239, 0.08) 0%, ${palette.iconBg} 100%)`}
                    border="1px solid"
                    borderColor={modalBorder}
                    boxShadow={`0 0 20px ${palette.glow}`}
                >
                    <Icon as={palette.icon} color={palette.iconColor} boxSize={8} />
                </Flex>
                <Box flex="1">
                    <Text fontSize="sm" fontWeight="700" lineHeight="1.4">
                        {title}
                    </Text>
                    {description ? (
                        <Text mt={1} fontSize="xs" color={modalMutedText} lineHeight="1.5">
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
