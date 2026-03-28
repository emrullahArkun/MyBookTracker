import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { SessionCompletionSummary } from '../model/useReadingSessionStopFlow';
import { useThemeTokens } from '../../../shared/theme/useThemeTokens';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

type SessionCompletionOverlayProps = {
    summary: SessionCompletionSummary;
    pageCount: number | null;
};

const SessionCompletionOverlay = ({ summary, pageCount }: SessionCompletionOverlayProps) => {
    const { t } = useTranslation();
    const { textColor, overlayBg, modalBg, modalBorder, modalMutedText, brandColor, modalShadow } = useThemeTokens();
    const maxPage = Math.max(pageCount ?? 0, summary.endPage, summary.startPage, 1);
    const startPercent = Math.max(0, Math.min((summary.startPage / maxPage) * 100, 100));
    const endPercent = Math.max(0, Math.min((summary.endPage / maxPage) * 100, 100));

    return (
        <MotionBox
            position="fixed"
            inset={0}
            zIndex="modal"
            bg={overlayBg}
            display="flex"
            alignItems="center"
            justifyContent="center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
        >
            <MotionBox
                w={{ base: 'calc(100% - 32px)', sm: '440px' }}
                maxW="440px"
                borderRadius="18px"
                px={{ base: 5, md: 7 }}
                py={{ base: 6, md: 8 }}
                bg={modalBg}
                border="1px solid"
                borderColor={modalBorder}
                boxShadow={modalShadow}
                position="relative"
                overflow="hidden"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
            >
                <Box
                    position="absolute"
                    top="0"
                    left="24px"
                    right="24px"
                    h="1px"
                    bg="linear-gradient(90deg, rgba(217, 188, 146, 0) 0%, rgba(217, 188, 146, 0.38) 50%, rgba(217, 188, 146, 0) 100%)"
                    pointerEvents="none"
                />
                <Box
                    position="absolute"
                    top="-90px"
                    right="-80px"
                    w="200px"
                    h="200px"
                    borderRadius="full"
                    bg="radial-gradient(circle, rgba(197, 154, 92, 0.16) 0%, rgba(197, 154, 92, 0) 72%)"
                    pointerEvents="none"
                />
                <Box
                    position="absolute"
                    bottom="-100px"
                    left="-90px"
                    w="220px"
                    h="220px"
                    borderRadius="full"
                    bg="radial-gradient(circle, rgba(149, 161, 127, 0.14) 0%, rgba(149, 161, 127, 0) 72%)"
                    pointerEvents="none"
                />
                <VStack spacing={6} textAlign="center">
                    <MotionBox
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.25 }}
                    >
                        <Text
                            fontSize="10px"
                            color={brandColor}
                            textTransform="uppercase"
                            letterSpacing="0.2em"
                            fontWeight="700"
                        >
                            {t('readingSession.completion.badge')}
                        </Text>
                    </MotionBox>

                    <MotionBox
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.35, ease: 'easeOut' }}
                    >
                        <Text
                            fontSize={{ base: '4xl', md: '5xl' }}
                            fontWeight="700"
                            color={textColor}
                            lineHeight="1"
                            letterSpacing="-0.04em"
                            fontFamily="heading"
                        >
                            +{summary.pagesRead}
                        </Text>
                        <Text
                            color={textColor}
                            fontSize={{ base: 'xl', md: '2xl' }}
                            fontFamily="heading"
                            fontWeight="600"
                            lineHeight="1.1"
                            mt={3}
                        >
                            {t('readingSession.completion.title')}
                        </Text>
                        <Text
                            fontSize="xs"
                            color={modalMutedText}
                            textTransform="uppercase"
                            letterSpacing="0.12em"
                            fontWeight="600"
                            mt={1.5}
                        >
                            {t('readingSession.completion.subtitle', { pages: summary.pagesRead })}
                        </Text>
                    </MotionBox>

                    <MotionBox
                        w="100%"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 }}
                    >
                        <Box
                            position="relative"
                            h="8px"
                            borderRadius="full"
                            bg="rgba(248, 236, 214, 0.08)"
                            overflow="hidden"
                        >
                            <Box
                                position="absolute"
                                left={0}
                                top={0}
                                bottom={0}
                                w={`${startPercent}%`}
                                bg="rgba(248, 236, 214, 0.08)"
                                borderRadius="full"
                            />
                            <MotionBox
                                position="absolute"
                                left={0}
                                top={0}
                                bottom={0}
                                borderRadius="full"
                                bg="linear-gradient(90deg, rgba(167, 119, 63, 0.95) 0%, rgba(217, 188, 146, 0.96) 100%)"
                                boxShadow="0 0 14px rgba(197, 154, 92, 0.14)"
                                initial={{ width: `${startPercent}%` }}
                                animate={{ width: `${endPercent}%` }}
                                transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.6 }}
                            />
                        </Box>

                        <MotionFlex
                            justify="space-between"
                            mt={3}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.9 }}
                        >
                            <VStack spacing={0.5} align="start">
                                <Text fontSize="10px" color={modalMutedText} textTransform="uppercase" letterSpacing="0.08em" fontWeight="600">
                                    {t('readingSession.completion.startLabel')}
                                </Text>
                                <Text color={modalMutedText} fontWeight="700" fontSize="lg" fontFamily="heading">
                                    {summary.startPage}
                                </Text>
                            </VStack>
                            <VStack spacing={0.5} align="end">
                                <Text fontSize="10px" color={modalMutedText} textTransform="uppercase" letterSpacing="0.08em" fontWeight="600">
                                    {t('readingSession.completion.endLabel')}
                                </Text>
                                <Text color={textColor} fontWeight="700" fontSize="lg" fontFamily="heading">
                                    {summary.endPage}
                                </Text>
                            </VStack>
                        </MotionFlex>
                    </MotionBox>
                </VStack>
            </MotionBox>
        </MotionBox>
    );
};

export default SessionCompletionOverlay;
