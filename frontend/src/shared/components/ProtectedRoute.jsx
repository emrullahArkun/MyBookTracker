import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ReadingSessionProvider } from '../../context/ReadingSessionContext';
import AuthGateLoader from './AuthGateLoader';

const ProtectedRoute = ({ requireAdmin }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <AuthGateLoader />;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (requireAdmin && user.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return (
        <ReadingSessionProvider>
            <Outlet />
        </ReadingSessionProvider>
    );
};

export default ProtectedRoute;

