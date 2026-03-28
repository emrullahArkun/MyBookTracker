import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Center, Spinner } from '@chakra-ui/react';
import { ROUTES } from './routes';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import MainLayout from '../layouts/MainLayout';

const HomePage = lazy(() => import('../../features/home/pages/HomePage'));
const SearchPage = lazy(() => import('../../features/search/pages/SearchPage'));
const GoalsPage = lazy(() => import('../../features/goals/pages/GoalsPage'));
const LibraryPage = lazy(() => import('../../features/library/pages/LibraryPage'));
const BookStatsPage = lazy(() => import('../../features/library/pages/BookStatsPage'));
const ReadingSessionPage = lazy(() => import('../../features/reading-session/pages/ReadingSessionPage'));
const StatsOverviewPage = lazy(() => import('../../features/stats/pages/StatsOverviewPage'));
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../../features/auth/pages/RegisterPage'));

const PageLoader = () => (
    <Center h="100vh" w="full" bg="transparent">
        <Spinner size="xl" color="teal.200" thickness="4px" />
    </Center>
);

const AppRouter = () => {
    return (
        <Router>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    <Route element={<ProtectedRoute />}>
                        <Route element={<MainLayout />}>
                            <Route path={ROUTES.HOME} element={<HomePage />} />
                            <Route path={ROUTES.SEARCH} element={<SearchPage />} />
                            <Route path={ROUTES.DISCOVERY} element={<Navigate to={ROUTES.SEARCH} replace />} />
                            <Route path={ROUTES.GOALS} element={<GoalsPage />} />
                            <Route path={ROUTES.MY_BOOKS} element={<LibraryPage />} />
                            <Route path={ROUTES.STATS} element={<StatsOverviewPage />} />
                            <Route path={ROUTES.ACHIEVEMENTS} element={<Navigate to={ROUTES.STATS} replace />} />
                            <Route path={ROUTES.BOOK_STATS(':id')} element={<BookStatsPage />} />
                            <Route path={ROUTES.BOOK_SESSION(':id')} element={<ReadingSessionPage />} />
                        </Route>
                    </Route>

                    <Route
                        path={ROUTES.LOGIN}
                        element={(
                            <PublicRoute>
                                <LoginPage />
                            </PublicRoute>
                        )}
                    />
                    <Route
                        path={ROUTES.REGISTER}
                        element={(
                            <PublicRoute>
                                <RegisterPage />
                            </PublicRoute>
                        )}
                    />
                </Routes>
            </Suspense>
        </Router>
    );
};

export default AppRouter;
