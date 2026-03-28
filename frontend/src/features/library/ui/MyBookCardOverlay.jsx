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
            bg="linear-gradient(180deg, rgba(21, 16, 13, 0.36) 0%, rgba(21, 16, 13, 0.72) 100%)"
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
            borderRadius="12px"
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
                        color="#f4ead7"
                        p={3}
                        borderRadius="md"
                        bg="rgba(197, 154, 92, 0.2)"
                        border="1px solid"
                        borderColor="rgba(217, 188, 146, 0.28)"
                        transition="all 0.2s"
                        _hover={{ bg: 'rgba(197, 154, 92, 0.3)', transform: 'translateY(-1px)' }}
                    >
                        <FaPlay size="20px" />
                    </Box>
                    <Text color="rgba(244, 234, 215, 0.82)" fontSize="xs" fontWeight="600" textTransform="uppercase" letterSpacing="0.12em">
                        {t('readingSession.start')}
                    </Text>
                </VStack>
            </Box>

            <Box
                as="button"
                type="button"
                w="100%"
                py={2}
                bg="rgba(248, 236, 214, 0.08)"
                color="rgba(244, 234, 215, 0.82)"
                fontSize="xs"
                fontWeight="600"
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ bg: 'rgba(248, 236, 214, 0.14)', color: '#f4ead7' }}
                onClick={navigateToStats}
                aria-label={t('navbar.stats')}
                borderBottomRadius="12px"
            >
                <FaChartBar size="12px" />
                {t('navbar.stats')}
            </Box>
        </Flex>
    );
}

export default MyBookCardOverlay;
