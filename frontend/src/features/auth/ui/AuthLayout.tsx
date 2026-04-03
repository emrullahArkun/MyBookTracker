import { useTranslation } from 'react-i18next';
import { MdAutoStories, MdTimelapse, MdInsights } from 'react-icons/md';
import { Card } from '../../../shared/ui/Card';
import LanguageSwitcher from '../../../app/navigation/LanguageSwitcher';
import './AuthLayout.css';

export const AuthLayout = ({ children, title, icon, variant = 'default' }) => {
    const { t } = useTranslation();

    const features = [
        { icon: MdAutoStories, label: 'auth.brand.features.track' },
        { icon: MdTimelapse, label: 'auth.brand.features.time' },
        { icon: MdInsights, label: 'auth.brand.features.visualize' },
    ];

    return (
        <div className={`auth-layout auth-layout--${variant}`}>
            <div className="auth-layout__language-switcher">
                <LanguageSwitcher variant="auth" />
            </div>

            <div className="auth-layout__brand">
                {/* Top: compact brand lockup */}
                <div className="auth-layout__brand-header">
                    <img
                        src="/mybooktracker.png"
                        alt=""
                        className="auth-layout__logo-img"
                    />
                    <span className="auth-layout__brand-name">{t('auth.brand.appName')}</span>
                </div>

                {/* Center: hero tagline */}
                <div className="auth-layout__hero">
                    <h1 className="auth-layout__tagline">{t('auth.brand.tagline')}</h1>

                    <ul className="auth-layout__features">
                        {features.map((f, i) => (
                            <li key={i}>
                                <span className="auth-layout__feature-dot" />
                                <f.icon className="auth-layout__feature-icon" />
                                <span>{t(f.label)}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Bottom: quote */}
                <blockquote className="auth-layout__quote">
                    <p className="auth-layout__quote-text">{t('auth.brand.quote')}</p>
                    <footer className="auth-layout__quote-source">{t('auth.brand.quoteSource')}</footer>
                </blockquote>
            </div>

            <div className="auth-layout__form-area">
                <div className="auth-layout__form-shell">
                    <Card className="auth-layout__card">
                        <div className="auth-layout__header">
                            {icon && <span className="auth-layout__mobile-icon">{icon}</span>}
                            <h2 className="auth-layout__title">{title}</h2>
                        </div>
                        {children}
                    </Card>
                </div>
            </div>
        </div>
    );
};
