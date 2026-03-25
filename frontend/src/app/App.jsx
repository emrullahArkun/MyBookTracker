import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ROUTES } from './routes';
import { Center, Spinner } from '@chakra-ui/react';
import { AuthProvider } from '../context/AuthContext';
import { AnimationProvider } from '../context/AnimationContext';
import ProtectedRoute from '../shared/components/ProtectedRoute';
import PublicRoute from '../shared/components/PublicRoute';
import ErrorBoundary from '../shared/components/ErrorBoundary';
import MainLayout from '../layouts/MainLayout';
import './App.css'

const MyBooks = lazy(() => import('../features/my-books/MyBooks'));
const BookStatsPage = lazy(() => import('../features/my-books/pages/BookStatsPage'));
const ReadingSessionPage = lazy(() => import('../features/my-books/pages/ReadingSessionPage'));
const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const DiscoveryPage = lazy(() => import('../features/discovery/DiscoveryPage'));
const GoalsPage = lazy(() => import('../pages/GoalsPage'));
const StatsOverviewPage = lazy(() => import('../pages/StatsOverviewPage'));
const AchievementsPage = lazy(() => import('../pages/AchievementsPage'));

// Loading Component
const PageLoader = () => (
  <Center h="100vh" w="full" bg="transparent">
    <Spinner size="xl" color="teal.200" thickness="4px" />
  </Center>
);

function App() {
  return (
    <AuthProvider>
      <AnimationProvider>
        <Router>
          <div className="app-container">
            <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Protected Routes Layout */}
                <Route element={<ProtectedRoute />}>
                  {/* Standard Layout */}
                  <Route element={<MainLayout />}>
                    <Route path={ROUTES.HOME} element={<HomePage />} />
                    <Route path={ROUTES.SEARCH} element={<HomePage />} />
                  </Route>

                  {/* Full Width Layout */}
                  <Route element={<MainLayout fullWidth={true} />}>
                    <Route path={ROUTES.DISCOVERY} element={<DiscoveryPage />} />
                    <Route path={ROUTES.GOALS} element={<GoalsPage />} />
                    <Route path={ROUTES.MY_BOOKS} element={<MyBooks />} />
                    <Route path={ROUTES.STATS} element={<StatsOverviewPage />} />
                    <Route path={ROUTES.ACHIEVEMENTS} element={<AchievementsPage />} />
                    <Route path="/books/:id/stats" element={<BookStatsPage />} />
                    <Route path="/books/:id/session" element={<ReadingSessionPage />} />
                  </Route>
                </Route>

                {/* Public Routes */}
                <Route path={ROUTES.LOGIN} element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                <Route path={ROUTES.REGISTER} element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                } />
              </Routes>
            </Suspense>
            </ErrorBoundary>
          </div>
        </Router>
      </AnimationProvider>
    </AuthProvider>
  )
}

export default App

