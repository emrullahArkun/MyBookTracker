import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../app/routes';
import AuthGateLoader from './AuthGateLoader';

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <AuthGateLoader />;
    }

    if (user) {
        return <Navigate to={ROUTES.HOME} replace />;
    }

    return children;
};

export default PublicRoute;

