import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth';
import { ReadingSessionProvider, SessionTimerProvider } from '../../features/reading-session';
import { ROUTES } from './routes';
import AuthGateLoader from './AuthGateLoader';

const ProtectedRoute = ({ requireAdmin = false }: { requireAdmin?: boolean }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <AuthGateLoader />;
    }

    if (!user) {
        return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
    }

    if (requireAdmin && user.role !== 'ADMIN') {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return (
        <ReadingSessionProvider>
            <SessionTimerProvider>
                <Outlet />
            </SessionTimerProvider>
        </ReadingSessionProvider>
    );
};

export default ProtectedRoute;
