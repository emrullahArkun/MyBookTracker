import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NoSessionsModal from './NoSessionsModal';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('../../../shared/theme/useThemeTokens', () => ({
    useThemeTokens: () => ({
        textColor: '#fff',
        overlayBg: 'rgba(0,0,0,0.5)',
        modalBg: '#111',
        modalBorder: '#333',
        modalSubtleBg: '#222',
        modalMutedText: '#aaa',
        modalShadow: 'none',
        brandColor: '#c59a5c',
    }),
}));

vi.mock('react-icons/fa', () => ({
    FaBookReader: () => <span data-testid="book-reader-icon" />,
}));

vi.mock('@chakra-ui/react', () => ({
    Modal: ({ children, isOpen, onClose }: { children: React.ReactNode; isOpen: boolean; onClose: () => void }) =>
        isOpen ? <div data-testid="modal" data-onclose={onClose}>{children}</div> : null,
    ModalOverlay: () => <div data-testid="modal-overlay" />,
    ModalContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    ModalBody: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
        <button onClick={onClick}>{children}</button>
    ),
    Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Icon: ({ as: Icon }: { as: React.ComponentType }) => <Icon />,
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe('NoSessionsModal', () => {
    it('renders the modal when isOpen is true', () => {
        render(<NoSessionsModal bookId={42} isOpen={true} />);
        expect(screen.getByTestId('modal')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
        render(<NoSessionsModal bookId={42} isOpen={false} />);
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    it('renders the title and description', () => {
        render(<NoSessionsModal bookId={42} isOpen={true} />);
        expect(screen.getByText('bookStats.noSessions.title')).toBeInTheDocument();
        expect(screen.getByText('bookStats.noSessions.desc')).toBeInTheDocument();
    });

    it('renders the start session button', () => {
        render(<NoSessionsModal bookId={42} isOpen={true} />);
        expect(screen.getByText('bookStats.noSessions.button')).toBeInTheDocument();
    });

    it('navigates to session page when start button is clicked', () => {
        render(<NoSessionsModal bookId={42} isOpen={true} />);
        fireEvent.click(screen.getByText('bookStats.noSessions.button'));
        expect(mockNavigate).toHaveBeenCalledWith('/books/42/session');
    });

    it('navigates to MY_BOOKS when back button is clicked', () => {
        render(<NoSessionsModal bookId={42} isOpen={true} />);
        fireEvent.click(screen.getByText('common.back'));
        expect(mockNavigate).toHaveBeenCalledWith('/my-books');
    });
});
