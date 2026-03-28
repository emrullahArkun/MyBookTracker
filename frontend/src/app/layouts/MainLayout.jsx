import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Box, Flex } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Navbar from '../navigation/Navbar';
import { useReadingSessionContext } from '../../features/reading-session/model/ReadingSessionContext';
import { ROUTES } from '../router/routes';

const MotionBox = motion(Box);

const MainLayout = () => {
    const { t } = useTranslation();
    const isSessionPage = useMatch('/books/:id/session');
    const location = useLocation();
    const isGoalsPage = useMatch(ROUTES.GOALS);
    const isLibraryPage = useMatch(ROUTES.MY_BOOKS);
    const isStatsOverviewPage = useMatch(ROUTES.STATS);
    const isBookStatsPage = useMatch(ROUTES.BOOK_STATS(':id'));
    const isFullWidthRoute = Boolean(
        isGoalsPage
        || isLibraryPage
        || isStatsOverviewPage
        || isBookStatsPage
        || isSessionPage
    );

    const { activeSession } = useReadingSessionContext();
    const navigate = useNavigate();

    // Global Session Alert
    const showSessionAlert = activeSession && !isSessionPage && activeSession.bookId;

    return (
        <Box
            minH="100vh"
            position="relative"
            overflow="hidden"
            bg="#17110d"
        >
            <Box position="fixed" inset={0} pointerEvents="none" zIndex={0}>
                <Box
                    position="absolute"
                    inset={0}
                    bg="linear-gradient(180deg, #1f1712 0%, #17110d 46%, #130f0c 100%)"
                />
                <Box
                    position="absolute"
                    inset={0}
                    opacity={0.22}
                    bgImage="linear-gradient(90deg, rgba(246, 239, 223, 0.015) 1px, transparent 1px), linear-gradient(180deg, rgba(246, 239, 223, 0.018) 1px, transparent 1px)"
                    bgSize="80px 80px, 80px 80px"
                />
                <Box
                    position="absolute"
                    inset={0}
                    opacity={0.12}
                    bg="linear-gradient(180deg, rgba(246, 239, 223, 0.03) 0%, transparent 26%), radial-gradient(circle at top left, rgba(197, 154, 92, 0.14) 0%, rgba(197, 154, 92, 0) 34%)"
                />
                <Box
                    position="absolute"
                    top={0}
                    left={{ base: '18px', md: '36px' }}
                    bottom={0}
                    w="1px"
                    bg="linear-gradient(180deg, rgba(217, 188, 146, 0.26) 0%, rgba(217, 188, 146, 0.03) 32%, rgba(217, 188, 146, 0.08) 100%)"
                />
                <Box
                    position="absolute"
                    top="-10rem"
                    right="-8rem"
                    w="28rem"
                    h="28rem"
                    borderRadius="full"
                    bg="radial-gradient(circle, rgba(99, 87, 61, 0.18) 0%, rgba(99, 87, 61, 0) 72%)"
                />
                <Box
                    position="absolute"
                    bottom="-8rem"
                    left="-6rem"
                    w="24rem"
                    h="24rem"
                    borderRadius="full"
                    bg="radial-gradient(circle, rgba(197, 154, 92, 0.08) 0%, rgba(197, 154, 92, 0) 74%)"
                />
            </Box>

            <Box position="relative">
                {showSessionAlert && (
                    <Box
                        position="fixed"
                        top={{ base: '90px', md: '102px' }}
                        right={{ base: '20px', md: '32px' }}
                        zIndex="toast"
                        width={{ base: 'calc(100% - 40px)', md: 'auto' }}
                    >
                        <Flex
                            as="button"
                            bg="linear-gradient(180deg, rgba(39, 29, 22, 0.96) 0%, rgba(27, 21, 17, 0.98) 100%)"
                            color="#f4ead7"
                            px={{ base: 4, md: 5 }}
                            py={3}
                            borderRadius="lg"
                            border="1px solid"
                            borderColor="rgba(217, 188, 146, 0.18)"
                            boxShadow="0 18px 34px rgba(8, 6, 4, 0.24)"
                            align="center"
                            gap={3}
                            cursor="pointer"
                            transition="transform 0.2s, border-color 0.2s"
                            _hover={{ transform: 'translateY(-1px)', borderColor: 'rgba(217, 188, 146, 0.3)' }}
                            onClick={() => navigate(`/books/${activeSession.bookId}/session`)}
                        >
                            <Box
                                w="11px"
                                h="11px"
                                borderRadius="sm"
                                bg="#c59a5c"
                                flexShrink={0}
                            />
                            <Box textAlign="left">
                                <Box as="span" display="block" fontSize="xs" textTransform="uppercase" letterSpacing="0.14em" color="rgba(217, 204, 182, 0.56)">
                                    {t('session.kicker')}
                                </Box>
                                <Box as="span" display="block" fontWeight="600">
                                    {t('session.returnToSession')}
                                </Box>
                                <Box as="span" display="block" fontSize="sm" color="rgba(217, 204, 182, 0.74)">
                                    {t('session.returnHint')}
                                </Box>
                            </Box>
                        </Flex>
                    </Box>
                )}
                <Navbar sessionMode={Boolean(isSessionPage)} />
            </Box>
            <Box
                className={`main-layout-content${isSessionPage ? ' main-layout-content--session' : ''}`}
                {...(isFullWidthRoute && { maxW: '100%', pl: 0, pr: 0 })}
            >
                <MotionBox
                    key={location.pathname}
                    className="main-layout-scene"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                    <Outlet />
                </MotionBox>
            </Box>
        </Box>
    );
};

export default MainLayout;
