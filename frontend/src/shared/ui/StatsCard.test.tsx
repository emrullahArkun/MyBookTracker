import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StatsCard from './StatsCard';
import { FaClock } from 'react-icons/fa';

vi.mock('framer-motion', () => ({
    motion: (C: React.ComponentType<Record<string, unknown>> | string) => {
        const Wrapped = (props: Record<string, unknown>) => {
            const { initial, animate, transition, ...rest } = props;
            void initial; void animate; void transition;
            if (typeof C === 'string') return <C {...rest} />;
            return <C {...rest} />;
        };
        Wrapped.displayName = 'Motion';
        return Wrapped;
    },
}));

vi.mock('react-icons/fa', () => ({
    FaClock: () => <span data-testid="icon" />,
}));

describe('StatsCard', () => {
    it('renders label and value', () => {
        render(<StatsCard icon={FaClock} label="Total Time" value="3h 20m" />);
        expect(screen.getByText('Total Time')).toBeInTheDocument();
        expect(screen.getByText('3h 20m')).toBeInTheDocument();
    });

    it('renders subLabel when provided', () => {
        render(<StatsCard icon={FaClock} label="Speed" value="25" subLabel="pages/hr" />);
        expect(screen.getByText('pages/hr')).toBeInTheDocument();
    });

    it('renders the icon', () => {
        render(<StatsCard icon={FaClock} label="Time" value="1h" />);
        expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('renders in compact mode', () => {
        render(<StatsCard icon={FaClock} label="Time" value="1h" compact />);
        expect(screen.getByText('Time')).toBeInTheDocument();
        expect(screen.getByText('1h')).toBeInTheDocument();
    });

    it('renders with color and delay props', () => {
        render(<StatsCard icon={FaClock} label="L" value="V" color="#c59a5c" delay={0.1} bg="#111" textColor="#fff" />);
        expect(screen.getByText('V')).toBeInTheDocument();
    });
});
