import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useMatch } from 'react-router-dom';
import { FaBook, FaSignOutAlt, FaSignInAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth';
import { useReadingSessionContext } from '../../features/reading-session';
import { useAnimation } from '../providers/AnimationProvider';
import { ROUTES } from '../router/routes';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

function Navbar({ sessionMode = false }: { sessionMode?: boolean }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const { registerTarget } = useAnimation();
    const { activeSession } = useReadingSessionContext();

    const isStatsPage = useMatch('/books/:id/stats');
    const isSessionPage = useMatch('/books/:id/session');

    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate(ROUTES.LOGIN);
    };

    const isActive = (path: string) => {
        if (path === ROUTES.HOME) return location.pathname === ROUTES.HOME;
        if (path === ROUTES.SEARCH) return location.pathname === ROUTES.SEARCH;
        return location.pathname === path;
    };

    const navItems = [
        { to: ROUTES.HOME, label: t('navbar.focus') },
        { to: ROUTES.SEARCH, label: t('navbar.search') },
        { to: ROUTES.MY_BOOKS, label: t('navbar.myBooks'), ref: registerTarget },
        { to: ROUTES.STATS, label: t('navbar.overview') },
        { to: ROUTES.GOALS, label: t('navbar.goals') },
    ];

    const extraItems: typeof navItems = [];
    if (activeSession && !sessionMode) {
        extraItems.push({ to: `/books/${activeSession.bookId}/session`, label: t('navbar.session') });
    }
    if (isStatsPage && !isSessionPage) {
        extraItems.push({ to: location.pathname, label: t('navbar.stats') });
    }

    return (
        <nav className={`navbar${sessionMode ? ' navbar--session' : ''}`}>
            <div className="navbar-shell">
                <div className="navbar-brand">
                    {sessionMode ? (
                        <div className="navbar-brand-static">
                            <FaBook /> {t('navbar.brand')}
                        </div>
                    ) : (
                        <Link to={ROUTES.HOME} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FaBook /> {t('navbar.brand')}
                        </Link>
                    )}
                </div>
                <div className="navbar-menu">
                    {user ? (
                        <>
                            {!sessionMode && (
                                <button
                                    className="navbar-hamburger"
                                    onClick={() => setMobileOpen((v) => !v)}
                                    aria-label="Menu"
                                >
                                    {mobileOpen ? <FaTimes /> : <FaBars />}
                                </button>
                            )}

                            <div className="navbar-nav">
                                {!sessionMode && (
                                    [...navItems, ...extraItems].map(item => (
                                        <Link
                                            key={`${item.to}-${item.label}`}
                                            to={item.to}
                                            className={`navbar-item${isActive(item.to) ? ' active' : ''}`}
                                            ref={item.ref ?? undefined}
                                        >
                                            <span className="navbar-text">{item.label}</span>
                                        </Link>
                                    ))
                                )}
                            </div>

                            {!sessionMode && (
                                <>
                                    <div className="navbar-separator" />

                                    <button onClick={handleLogout} className="navbar-action logout-btn" aria-label={t('navbar.logout')}>
                                        <FaSignOutAlt />
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <Link to={ROUTES.LOGIN} className="navbar-action navbar-login">
                            <FaSignInAlt /> {t('navbar.login')}
                        </Link>
                    )}
                    {!sessionMode && <LanguageSwitcher variant="navbar" />}
                </div>
            </div>

            {mobileOpen && !sessionMode && user && (
                <div className="navbar-mobile-menu">
                    {[...navItems, ...extraItems].map(item => (
                        <Link
                            key={`${item.to}-${item.label}`}
                            to={item.to}
                            className={`navbar-mobile-item${isActive(item.to) ? ' active' : ''}`}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <div className="navbar-mobile-separator" />
                    <div className="navbar-mobile-bottom">
                        <LanguageSwitcher variant="navbar" />
                        <button onClick={handleLogout} className="navbar-action logout-btn" aria-label={t('navbar.logout')}>
                            <FaSignOutAlt /> {t('navbar.logout')}
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
