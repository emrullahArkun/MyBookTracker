import { useState, type ChangeEvent, type CSSProperties, type FormEvent } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { ROUTES } from '../../../app/router/routes';
import { useTranslation } from 'react-i18next';
import { useToast } from '@chakra-ui/react';
import { MdEmail, MdLock, MdAppRegistration } from 'react-icons/md';
import { authApi } from '../api/authApi';
import { getErrorMessage } from '../../../shared/lib/errorUtils';
import { AuthLayout } from '../ui/AuthLayout';
import { TextField } from '../../../shared/ui/TextField';
import { Button } from '../../../shared/ui/Button';
import { createAppToast } from '../../../shared/ui/AppToast';
import styles from './RegisterPage.module.css';

const linkStyle: CSSProperties = {
    color: '#f3c785',
    fontWeight: 600,
    textDecoration: 'none',
    fontSize: '0.875rem',
};

type RegisterFormErrors = {
    email?: string;
    password?: string;
    confirmPassword?: string;
};

function RegisterPage() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<RegisterFormErrors>({});
    const navigate = useNavigate();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const validate = (): boolean => {
        const newErrors: RegisterFormErrors = {};

        if (!email) {
            newErrors.email = t('auth.required');
        } else if (!email.includes('@')) {
            newErrors.email = t('auth.invalidEmail');
        }

        if (!password) newErrors.password = t('auth.required');
        if (!confirmPassword) newErrors.confirmPassword = t('auth.required');
        if (password && confirmPassword && password !== confirmPassword) {
            newErrors.confirmPassword = t('auth.passwordsDoNotMatch');
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const clearFieldError = (field: keyof RegisterFormErrors) => {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        clearFieldError('email');
    };

    const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        clearFieldError('password');
    };

    const handleConfirmPasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        clearFieldError('confirmPassword');
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validate()) return;

        setIsLoading(true);

        try {
            await authApi.register(email, password);

            toast(createAppToast({
                title: t('auth.register.title'),
                description: t('auth.register.success'),
                status: 'success',
                duration: 5000,
                position: 'top-right',
            }));
            navigate(ROUTES.LOGIN);
        } catch (err) {
            toast(createAppToast({
                title: t('auth.errorTitle'),
                description: getErrorMessage(err, t('auth.errorTitle')),
                status: 'error',
                duration: 5000,
                position: 'top-right',
            }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title={t('auth.register.title')}
            icon={<MdAppRegistration />}
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
                        error={errors.email}
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
                        error={errors.password}
                        required
                        autoComplete="new-password"
                    />

                    <TextField
                        label={t('auth.confirmPassword')}
                        type="password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        placeholder={t('auth.confirmPassword')}
                        leftIcon={<MdLock />}
                        error={errors.confirmPassword}
                        required
                        autoComplete="new-password"
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    isLoading={isLoading}
                    className={styles.submitButton}
                >
                    {t('auth.register.button')}
                </Button>

                <div className={styles.footer}>
                    <span className={styles.footerText}>
                        {t('auth.register.loginLink')}{' '}
                    </span>
                    <RouterLink to={ROUTES.LOGIN} style={linkStyle} className={styles.loginLink}>
                        {t('auth.login.button')}
                    </RouterLink>
                </div>
            </form>
        </AuthLayout>
    );
}

export default RegisterPage;
