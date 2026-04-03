import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TextField } from './TextField';

describe('TextField', () => {
    it('renders an input element', () => {
        render(<TextField />);
        expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders a label when provided', () => {
        render(<TextField label="Email" />);
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders an error message', () => {
        render(<TextField error="Required" />);
        expect(screen.getByText('Required')).toBeInTheDocument();
    });

    it('adds error class when error is present', () => {
        const { container } = render(<TextField error="Bad" />);
        expect(container.querySelector('.ui-field__input-wrapper--error')).not.toBeNull();
    });

    it('renders leftIcon', () => {
        render(<TextField leftIcon={<span data-testid="left" />} />);
        expect(screen.getByTestId('left')).toBeInTheDocument();
    });

    it('renders rightElement', () => {
        render(<TextField rightElement={<span data-testid="right" />} />);
        expect(screen.getByTestId('right')).toBeInTheDocument();
    });

    it('uses name as id fallback', () => {
        render(<TextField name="email" label="Email" />);
        const input = screen.getByLabelText('Email');
        expect(input.id).toBe('email');
    });

    it('uses explicit id over name', () => {
        render(<TextField id="my-id" name="email" label="Email" />);
        expect(screen.getByLabelText('Email').id).toBe('my-id');
    });
});
