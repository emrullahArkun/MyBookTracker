import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import LanguageSwitcher from './LanguageSwitcher';

const mockChangeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
            resolvedLanguage: 'en',
            changeLanguage: mockChangeLanguage,
        },
    }),
}));

describe('LanguageSwitcher', () => {
    it('renders EN and DE buttons in default variant', () => {
        render(<LanguageSwitcher />);
        expect(screen.getByText('EN')).toBeDefined();
        expect(screen.getByText('DE')).toBeDefined();
    });

    it('calls changeLanguage("de") when DE button is clicked', async () => {
        render(<LanguageSwitcher />);
        await userEvent.click(screen.getByText('DE'));
        expect(mockChangeLanguage).toHaveBeenCalledWith('de');
    });

    it('calls changeLanguage("en") when EN button is clicked', async () => {
        render(<LanguageSwitcher />);
        await userEvent.click(screen.getByText('EN'));
        expect(mockChangeLanguage).toHaveBeenCalledWith('en');
    });

    it('renders EN and DE buttons in auth variant', () => {
        render(<LanguageSwitcher variant="auth" />);
        expect(screen.getByText('EN')).toBeDefined();
        expect(screen.getByText('DE')).toBeDefined();
    });

    it('renders text only for unknown variant', () => {
        render(<LanguageSwitcher variant="unknown" />);
        expect(screen.getByText('EN')).toBeDefined();
        expect(screen.queryAllByRole('button')).toHaveLength(0);
    });

    it('renders EN and DE buttons in navbar variant', () => {
        render(<LanguageSwitcher variant="navbar" />);
        expect(screen.getByText('EN')).toBeDefined();
        expect(screen.getByText('DE')).toBeDefined();
    });
});
