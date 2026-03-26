import { useState, useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const titleStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '1.4em',
    fontSize: '2.25rem',
    fontWeight: 600,
    letterSpacing: '-0.02em',
    width: '100%',
    textAlign: 'center',
    marginBottom: '20px',
    color: 'var(--neutral-50)',
};

const TypewriterTitle = () => {
    const { t } = useTranslation();
    const fullText = t('search.welcomeMessage');
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        setDisplayedText('');
        setCurrentIndex(0);

        let i = 0;
        const intervalId = window.setInterval(() => {
            i += 1;
            setDisplayedText(fullText.slice(0, i));
            setCurrentIndex(i);

            if (i >= fullText.length) {
                window.clearInterval(intervalId);
            }
        }, 50);

        return () => window.clearInterval(intervalId);
    }, [fullText]);

    return (
        <h1 style={titleStyle}>
            {displayedText}
            {currentIndex < fullText.length && (
                <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', marginLeft: '2px', width: '2px', height: '1em', backgroundColor: 'currentColor' }}
                />
            )}
        </h1>
    );
};

export default TypewriterTitle;
