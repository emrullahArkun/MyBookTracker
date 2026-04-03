import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Card } from './Card';

describe('Card', () => {
    it('renders children inside a ui-card div', () => {
        const { container } = render(<Card>Hello</Card>);
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(container.querySelector('.ui-card')).not.toBeNull();
    });

    it('applies additional className', () => {
        const { container } = render(<Card className="extra">Content</Card>);
        const card = container.querySelector('.ui-card');
        expect(card).not.toBeNull();
        expect(card).toHaveClass('extra');
    });
});
