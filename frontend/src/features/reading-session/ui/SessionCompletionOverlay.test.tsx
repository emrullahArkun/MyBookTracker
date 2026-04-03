import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SessionCompletionOverlay from './SessionCompletionOverlay';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, opts?: Record<string, unknown>) => {
            if (opts) return `${key}:${JSON.stringify(opts)}`;
            return key;
        },
    }),
}));

vi.mock('../../../shared/theme/useThemeTokens', () => ({
    useThemeTokens: () => ({
        textColor: '#fff',
        overlayBg: 'rgba(0,0,0,0.8)',
        modalBg: '#111',
        modalBorder: '#333',
        modalMutedText: '#aaa',
        brandColor: '#c59a5c',
        modalShadow: 'none',
    }),
}));

vi.mock('framer-motion', () => ({
    motion: (C: React.ComponentType<Record<string, unknown>> | string) => {
        const Wrapped = (props: Record<string, unknown>) => {
            const { initial, animate, transition, exit, ...rest } = props;
            void initial; void animate; void transition; void exit;
            if (typeof C === 'string') return <C {...rest} />;
            return <C {...rest} />;
        };
        Wrapped.displayName = `Motion`;
        return Wrapped;
    },
}));

describe('SessionCompletionOverlay', () => {
    const baseSummary = {
        pagesRead: 30,
        startPage: 70,
        endPage: 100,
        durationMs: 3600000,
    };

    it('renders the pages read count', () => {
        render(<SessionCompletionOverlay summary={baseSummary} pageCount={300} />);
        expect(screen.getByText('+30')).toBeInTheDocument();
    });

    it('renders completion title for non-zero pages', () => {
        render(<SessionCompletionOverlay summary={baseSummary} pageCount={300} />);
        expect(screen.getByText('readingSession.completion.title')).toBeInTheDocument();
    });

    it('renders zero-pages title when pagesRead is 0', () => {
        render(
            <SessionCompletionOverlay
                summary={{ ...baseSummary, pagesRead: 0 }}
                pageCount={300}
            />
        );
        expect(screen.getByText('readingSession.completion.titleZero')).toBeInTheDocument();
    });

    it('renders zero-pages subtitle when pagesRead is 0', () => {
        render(
            <SessionCompletionOverlay
                summary={{ ...baseSummary, pagesRead: 0 }}
                pageCount={300}
            />
        );
        expect(screen.getByText('readingSession.completion.subtitleZero')).toBeInTheDocument();
    });

    it('renders start and end page labels', () => {
        render(<SessionCompletionOverlay summary={baseSummary} pageCount={300} />);
        expect(screen.getByText('70')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('handles null pageCount gracefully', () => {
        render(<SessionCompletionOverlay summary={baseSummary} pageCount={null} />);
        expect(screen.getByText('+30')).toBeInTheDocument();
    });

    it('renders the badge text', () => {
        render(<SessionCompletionOverlay summary={baseSummary} pageCount={300} />);
        expect(screen.getByText('readingSession.completion.badge')).toBeInTheDocument();
    });
});
