import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '../../../app/router/routes';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../model/AuthContext';
import { MdEmail, MdLock, MdLogin } from 'react-icons/md';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '../../../shared/lib/errorUtils';
import styles from './LoginPage.module.css';
import { AuthLayout } from '../ui/AuthLayout';
import { TextField } from '../../../shared/ui/TextField';
import { Button } from '../../../shared/ui/Button';

type LocationState = {
    from?: {
        pathname?: string;
    };
};

function LoginPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState(import.meta.env.DEV ? 'admin@example.com' : '');
    const [password, setPassword] = useState(import.meta.env.DEV ? 'password' : '');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation() as ReturnType<typeof useLocation> & { state: LocationState | null };
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const data = await authApi.login(email, password);

            if (!data?.user) {
                throw new Error('Login response did not include a user');
            }

            login(data.user);

            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        } catch (err) {
            setError(getErrorMessage(err, t('auth.errorTitle')));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={t('auth.login.title')}
            icon={<MdLogin />}
        >
            <form onSubmit={handleSubmit} noValidate className={styles.form}>
                <div className={styles.inputsContainer}>
                    <TextField
                        label={t('auth.email')}
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder={t('auth.enterEmail')}
                        leftIcon={<MdEmail />}
                        required
                        autoComplete="email"
                    />

                    <TextField
                        label={t('auth.password')}
                        type="password"
                        value={password}
                        onChange={handlePasswordChange}
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
                    <RouterLink to={ROUTES.REGISTER} className={styles.registerLink}>
                        {t('auth.register.button')}
                    </RouterLink>
                </div>
            </form>
        </AuthLayout>
    );
}

export default LoginPage;
