import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
    it('renders children', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('applies variant class', () => {
        render(<Button variant="secondary">Go</Button>);
        expect(screen.getByRole('button')).toHaveClass('ui-btn--secondary');
    });

    it('defaults to primary variant', () => {
        render(<Button>Go</Button>);
        expect(screen.getByRole('button')).toHaveClass('ui-btn--primary');
    });

    it('shows spinner and hides content when isLoading', () => {
        render(<Button isLoading>Go</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        expect(btn).toHaveClass('ui-btn--loading');
        expect(btn.querySelector('.ui-btn__spinner')).not.toBeNull();
        expect(btn.querySelector('.ui-btn__content--hidden')).not.toBeNull();
    });

    it('renders leftIcon when not loading', () => {
        render(<Button leftIcon={<span data-testid="icon" />}>Go</Button>);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('does not render leftIcon when loading', () => {
        render(<Button isLoading leftIcon={<span data-testid="icon" />}>Go</Button>);
        expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('is disabled when disabled prop is set', () => {
        render(<Button disabled>Go</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });
});
