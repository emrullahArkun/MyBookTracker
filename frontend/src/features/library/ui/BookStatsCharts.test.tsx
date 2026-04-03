import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BookStatsCharts from './BookStatsCharts';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

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

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
    Area: () => <div />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    Tooltip: () => <div />,
    CartesianGrid: () => <div />,
}));

vi.mock('react-icons/fa', () => ({
    FaChartLine: () => <span data-testid="chart-icon" />,
}));

const baseProps = {
    bookId: 42,
    cardBg: '#111',
    textColor: '#fff',
    subTextColor: '#ccc',
    mutedTextColor: '#aaa',
    borderColor: '#333',
};

describe('BookStatsCharts', () => {
    it('renders chart when graphData has entries', () => {
        render(
            <BookStatsCharts
                {...baseProps}
                stats={{ graphData: [{ date: '01/01', page: 10 }], totalPages: 100 }}
            />
        );
        expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('renders empty state when graphData is empty', () => {
        render(
            <BookStatsCharts
                {...baseProps}
                stats={{ graphData: [], totalPages: 100 }}
            />
        );
        expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument();
        expect(screen.getByText('bookStats.chart.noData')).toBeInTheDocument();
    });

    it('renders chart title and subtitle', () => {
        render(
            <BookStatsCharts
                {...baseProps}
                stats={{ graphData: [{ date: '01/01', page: 10 }], totalPages: 100 }}
            />
        );
        expect(screen.getByText('bookStats.chart.title')).toBeInTheDocument();
        expect(screen.getByText('bookStats.chart.subTitle')).toBeInTheDocument();
    });

    it('renders "read now" button when no data', () => {
        render(
            <BookStatsCharts
                {...baseProps}
                stats={{ graphData: [], totalPages: 100 }}
            />
        );
        expect(screen.getByText('bookStats.chart.readNow')).toBeInTheDocument();
    });
});
