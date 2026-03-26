import { Box, Flex, Text, VStack } from '@chakra-ui/react';
import { FaChartBar, FaPlay } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/router/routes';

function MyBookCardOverlay({ bookId }) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const navigateToSession = (event) => {
        event.stopPropagation();
        navigate(ROUTES.BOOK_SESSION(bookId));
    };

    const navigateToStats = (event) => {
        event.stopPropagation();
        navigate(ROUTES.BOOK_STATS(bookId));
    };

    return (
        <Flex
            position="absolute"
            inset="0"
            bg="blackAlpha.600"
            opacity="0"
            visibility="hidden"
            pointerEvents="none"
            _groupHover={{ opacity: 1, visibility: 'visible', pointerEvents: 'auto' }}
            _groupFocusWithin={{ opacity: 1, visibility: 'visible', pointerEvents: 'auto' }}
            transition="all 0.25s ease"
            direction="column"
            justify="space-between"
            align="center"
            zIndex="10"
            borderRadius="10px"
        >
            <Box
                as="button"
                type="button"
                flex="1"
                w="100%"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                onClick={navigateToSession}
                aria-label={t('readingSession.start')}
            >
                <VStack spacing={1}>
                    <Box
                        color="white"
                        p={3}
                        borderRadius="full"
                        bg="whiteAlpha.200"
                        transition="all 0.2s"
                        _hover={{ bg: 'whiteAlpha.400', transform: 'scale(1.1)' }}
                    >
                        <FaPlay size="20px" />
                    </Box>
                    <Text color="whiteAlpha.800" fontSize="xs" fontWeight="500">
                        {t('readingSession.start')}
                    </Text>
                </VStack>
            </Box>

            <Box
                as="button"
                type="button"
                w="100%"
                py={2}
                bg="whiteAlpha.100"
                color="whiteAlpha.800"
                fontSize="xs"
                fontWeight="500"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ bg: 'whiteAlpha.200', color: 'white' }}
                onClick={navigateToStats}
                aria-label={t('navbar.stats')}
                borderBottomRadius="10px"
            >
                <FaChartBar size="12px" />
                {t('navbar.stats')}
            </Box>
        </Flex>
    );
}

export default MyBookCardOverlay;
