import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation, useMatch } from 'react-router-dom';
import { FaBook, FaSignOutAlt, FaSignInAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

import { useAnimation } from '../../context/AnimationContext';
import { useReadingSessionContext } from '../../context/ReadingSessionContext';
import LanguageSwitcher from './LanguageSwitcher';
import './Navbar.css';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const { registerTarget } = useAnimation();
    const { activeSession } = useReadingSessionContext();

    const navRef = useRef(null);
    const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false });

    const updateIndicator = useCallback(() => {
        const nav = navRef.current;
        if (!nav) return;
        const activeItem = nav.querySelector('.navbar-item.active');
        if (!activeItem) {
            setIndicator(prev => ({ ...prev, visible: false }));
            return;
        }
        const navRect = nav.getBoundingClientRect();
        const activeRect = activeItem.getBoundingClientRect();
        setIndicator({
            left: activeRect.left - navRect.left + 14,
            width: activeRect.width - 28,
            visible: true,
        });
    }, []);

    useEffect(() => {
        // Small delay to let AnimatePresence items settle
        const timer = setTimeout(updateIndicator, 50);
        return () => clearTimeout(timer);
    }, [location.pathname, activeSession, updateIndicator]);

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const observer = new ResizeObserver(() => updateIndicator());
        observer.observe(nav);
        return () => observer.disconnect();
    }, [updateIndicator]);

    const isStatsPage = useMatch('/books/:id/stats');
    const isSessionPage = useMatch('/books/:id/session');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/' || location.pathname === '/discovery';
        return location.pathname === path;
    };

    const navItems = [
        { to: '/discovery', label: t('navbar.discovery') },
        { to: '/search', label: t('navbar.search') },
        { to: '/my-books', label: t('navbar.myBooks'), ref: registerTarget },
        { to: '/stats', label: t('navbar.overview') },
        { to: '/goals', label: t('navbar.goals') },
        { to: '/achievements', label: t('navbar.achievements') },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaBook /> {t('navbar.brand')}
                </Link>
            </div>
            <div className="navbar-menu">
                {user ? (
                    <>
                        <div className="navbar-nav" ref={navRef}>
                            {navItems.map(item => (
                                <Link
                                    key={item.to}
                                    to={item.to}
                                    className={`navbar-item${isActive(item.to) ? ' active' : ''}`}
                                    ref={item.ref || null}
                                >
                                    <span className="navbar-text">{item.label}</span>
                                </Link>
                            ))}

                            <AnimatePresence>
                                {activeSession && (
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 'auto', opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                        style={{ display: 'flex', overflow: 'hidden', height: '100%' }}
                                    >
                                        <Link
                                            to={`/books/${activeSession.bookId}/session`}
                                            className={`navbar-item${isSessionPage ? ' active' : ''}`}
                                        >
                                            <span className="navbar-text">{t('navbar.session')}</span>
                                        </Link>
                                    </motion.div>
                                )}

                                {(isStatsPage && !isSessionPage) && (
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 'auto', opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                                        style={{ display: 'flex', overflow: 'hidden', height: '100%' }}
                                    >
                                        <Link
                                            to={location.pathname}
                                            className="navbar-item active"
                                        >
                                            <span className="navbar-text">{t('navbar.stats')}</span>
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {indicator.visible && (
                                <motion.div
                                    className="nav-indicator"
                                    animate={{ left: indicator.left, width: indicator.width }}
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                        </div>

                        <div className="navbar-separator" />

                        <button onClick={handleLogout} className="navbar-item logout-btn">
                            <FaSignOutAlt />
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="navbar-item">
                        <FaSignInAlt /> {t('navbar.login')}
                    </Link>
                )}
                <LanguageSwitcher />
            </div>
        </nav>
    );
}

export default Navbar;
