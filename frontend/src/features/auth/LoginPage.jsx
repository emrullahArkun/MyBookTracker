import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '@chakra-ui/react'; // Keeping toast for now as per plan
import { MdEmail, MdLock, MdLogin } from 'react-icons/md';
import { authApi } from './api/authApi';
import styles from './LoginPage.module.css';

// New UI Components
import { AuthLayout } from '../../ui/layouts/AuthLayout';
import { TextField } from '../../ui/TextField';
import { Button } from '../../ui/Button';

function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@example.com' : '');
    const [password, setPassword] = useState(import.meta.env.DEV ? 'password' : '');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await authApi.login(email, password);

            login({ email: data.user.email, role: data.user.role });
            toast({
                title: t('auth.login.title'),
                description: t('auth.login.success', "Successfully logged in."),
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "top-right",
            });
            // Redirect to original route if available, otherwise home
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message);
            toast({
                title: t('auth.errorTitle', "Error"),
                description: err.message,
                status: "error",
                duration: 5000,
                isClosable: true,
                position: "top-right"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={t('auth.login.title')}
            icon={<MdLogin />}
        >
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputsContainer}>
                    <TextField
                        label={t('auth.email')}
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={t('auth.enterEmail')}
                        leftIcon={<MdEmail />}
                        required
                        autoComplete="email"
                    />

                    <TextField
                        label={t('auth.password')}
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t('auth.enterPassword')}
                        leftIcon={<MdLock />}
                        required
                        autoComplete="current-password"
                    />
                </div>

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    className={styles.submitButton}
                >
                    {t('auth.login.button')}
                </Button>

                <div className={styles.footer}>
                    <span className={styles.footerText}>
                        {t('auth.register.link')}{' '}
                    </span>
                    <RouterLink to="/register" className={styles.registerLink}>
                        {t('auth.register.button')}
                    </RouterLink>
                </div>
            </form>
        </AuthLayout>
    );
}

export default LoginPage;
