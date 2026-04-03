import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PageErrorState from './PageErrorState';

vi.mock('@chakra-ui/react', () => ({
    Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
        <button onClick={onClick}>{children}</button>
    ),
    Flex: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe('PageErrorState', () => {
    it('renders the title', () => {
        render(<PageErrorState title="Something went wrong" />);
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders retry button when onRetry is provided', () => {
        const onRetry = vi.fn();
        render(<PageErrorState title="Error" onRetry={onRetry} retryLabel="Try again" />);
        expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
        const onRetry = vi.fn();
        render(<PageErrorState title="Error" onRetry={onRetry} retryLabel="Retry" />);
        fireEvent.click(screen.getByText('Retry'));
        expect(onRetry).toHaveBeenCalledOnce();
    });

    it('does not render retry button when onRetry is not provided', () => {
        render(<PageErrorState title="Error" />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
