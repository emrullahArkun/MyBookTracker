import { useMemo } from 'react';
import { useTranslation } from 'react-i18next'; 
import { MdLibraryBooks, MdTimer, MdShowChart, MdStar } from 'react-icons/md';
import { GiBookshelf } from 'react-icons/gi';
import { StringLights } from '../../../shared/ui/StringLights';
import { Card } from '../../../shared/ui/Card';
import LanguageSwitcher from '../../../app/navigation/LanguageSwitcher';
import './AuthLayout.css';

export const AuthLayout = ({ children, title, icon }) => {
    const { t } = useTranslation();
    const stars = useMemo(() => {
        return Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: `${Math.random() * 1.5 + 0.5}rem`, // 0.5rem to 2rem
            opacity: Math.random() * 0.5 + 0.1, // 0.1 to 0.6
            rotation: `${Math.random() * 360}deg`,
        }));
    }, []);

    return (
        <div className="auth-layout">
            <div className="auth-layout__language-switcher">
                <LanguageSwitcher variant="auth" />
            </div>

            {/* Brand Panel (Desktop Only) */}
            <div className="auth-layout__brand">
                {/* Background Stars */}
                {stars.map((star) => (
                    <MdStar
                        key={star.id}
                        style={{
                            position: 'absolute',
                            top: star.top,
                            left: star.left,
                            fontSize: star.size,
                            opacity: star.opacity,
                            transform: `rotate(${star.rotation})`,
                            color: 'var(--accent-200)',
                            pointerEvents: 'none',
                            zIndex: 0,
                        }}
                    />
                ))}

                <StringLights />
                <div className="auth-layout__brand-content">

                    <p className="auth-layout__tagline">
                        {t('auth.brand.tagline')}
                    </p>
                    <ul className="auth-layout__features">
                        {[
                            { icon: MdLibraryBooks, title: 'auth.brand.features.track', desc: 'auth.brand.features.trackDesc' },
                            { icon: MdTimer, title: 'auth.brand.features.time', desc: 'auth.brand.features.timeDesc' },
                            { icon: MdShowChart, title: 'auth.brand.features.visualize', desc: 'auth.brand.features.visualizeDesc' }
                        ].map((feature, index) => (
                            <li key={index}>
                                <div className="auth-layout__feature-header">
                                    <feature.icon className="auth-layout__feature-icon" />
                                    <span>{t(feature.title)}</span>
                                </div>
                                <div className="auth-layout__feature-tooltip">
                                    <div className="auth-layout__tooltip-title">{t(feature.title)}</div>
                                    <div className="auth-layout__tooltip-desc">{t(feature.desc)}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
                {/* Decorative Bookshelf Icon */}
                <div className="auth-layout__decorative-icon">
                    <GiBookshelf />
                </div>
            </div>

            {/* Form Area */}
            <div className="auth-layout__form-area">
                <Card className="auth-layout__card">
                    <div className="auth-layout__header">
                        {icon && <span className="auth-layout__mobile-icon">{icon}</span>}
                        <h2 className="auth-layout__title">{title}</h2>
                    </div>
                    {children}
                </Card>
            </div>
        </div>
    );
};
