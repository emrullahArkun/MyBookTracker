import { Outlet, useMatch, useNavigate } from 'react-router-dom';
import { Box, Flex, useToast } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import Navbar from '../shared/components/Navbar';
import { useReadingSessionContext } from '../context/ReadingSessionContext';

const MainLayout = ({ fullWidth = false }) => {
    const { t } = useTranslation();
    const isSessionPage = useMatch('/books/:id/session');

    const toast = useToast();

    const handleOverlayClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toast({
            title: t('readingSession.alerts.exitWarning'),
            status: 'warning',
            duration: 3000,
            isClosable: true,
            position: 'top'
        });
    };

    const { activeSession } = useReadingSessionContext();
    const navigate = useNavigate();

    // Global Session Alert
    const showSessionAlert = activeSession && !isSessionPage && activeSession.bookId;

    return (
        <Box
            minH="100vh"
            bg="var(--accent-800)"
            backgroundImage="repeating-linear-gradient(to right, transparent, transparent 39px, rgba(0, 0, 0, 0.1) 40px, rgba(0, 0, 0, 0.1) 41px)"
        >
            <Box position="relative">
                {showSessionAlert && (
                    <Box
                        position="fixed"
                        top="20px"
                        left="50%"
                        transform="translateX(-50%)"
                        zIndex="toast"
                        width="auto"
                    >
                        <Flex
                            as="button"
                            bg="teal.500"
                            color="white"
                            px={6}
                            py={3}
                            borderRadius="full"
                            boxShadow="lg"
                            align="center"
                            gap={3}
                            cursor="pointer"
                            transition="transform 0.2s"
                            _hover={{ transform: 'scale(1.05)' }}
                            onClick={() => navigate(`/books/${activeSession.bookId}/session`)}
                        >
                            <Box as="span" fontWeight="bold">⚠️ {t('session.returnToSession')}</Box>
                        </Flex>
                    </Box>
                )}
                <Navbar />
                {isSessionPage && (
                    <Box
                        position="fixed"
                        top={0}
                        left={0}
                        right={0}
                        h="90px"
                        zIndex="overlay"
                        cursor="not-allowed"
                        bg="transparent"
                        onClick={handleOverlayClick}
                    />
                )}
            </Box>
            <Box
                className="main-layout-content"
                {...(fullWidth && { maxW: '100%', pl: 0, pr: 0 })}
            >
                <Outlet />
            </Box>
        </Box>
    );
};

export default MainLayout;
