import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
                    <Route path="/" element={<HomePage />} />
                    <Route path="/search" element={<HomePage />} />
                  </Route>

                  {/* Full Width Layout */}
                  <Route element={<MainLayout fullWidth={true} />}>
                    <Route path="/discovery" element={<DiscoveryPage />} />
                    <Route path="/goals" element={<GoalsPage />} />
                    <Route path="/my-books" element={<MyBooks />} />
                    <Route path="/stats" element={<StatsOverviewPage />} />
                    <Route path="/achievements" element={<AchievementsPage />} />
                    <Route path="/books/:id/stats" element={<BookStatsPage />} />
                    <Route path="/books/:id/session" element={<ReadingSessionPage />} />
                  </Route>
                </Route>

                {/* Public Routes */}
                <Route path="/login" element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } />
                <Route path="/register" element={
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

