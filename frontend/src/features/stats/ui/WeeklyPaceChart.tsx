import { useMemo, useState } from 'react';
import { Box, Text, Flex, IconButton } from '@chakra-ui/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useTranslation } from 'react-i18next';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { DailyActivity } from '../../../shared/types/stats';

// Returns ISO week number for a given date
type WeeklyPaceDatum = {
    name: string;
    pages: number;
    dateRange: string;
};

type WeeklyPaceChartProps = {
    dailyActivity?: DailyActivity[];
};

type WeeklyTooltipProps = {
    active?: boolean;
    payload?: Array<{
        payload: WeeklyPaceDatum;
    }>;
};

const getISOWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const PAGE_SIZE = 5;

const CustomTooltip = ({ active, payload }: WeeklyTooltipProps) => {
    if (!active || !payload?.length) return null;
    const { dateRange, pages } = payload[0].payload;
    return (
        <Box bg="gray.900" px={3} py={2} borderRadius="lg" border="1px solid" borderColor="whiteAlpha.100">
            <Text fontSize="10px" color="gray.400">{dateRange}</Text>
            <Text fontSize="xs" color="teal.200" fontWeight="600">{pages} pages</Text>
        </Box>
    );
};

const WeeklyPaceChart = ({ dailyActivity = [] }: WeeklyPaceChartProps) => {
    const { t, i18n } = useTranslation();

    const weeklyData = useMemo(() => {
        const now = new Date();
        const weeks = 12;
        const buckets: Array<{
            start: Date;
            end: Date;
            label: string;
            dateRange: string;
            pages: number;
        }> = [];

        // Find Monday of the current calendar week
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() + mondayOffset);

        for (let w = weeks - 1; w >= 0; w--) {
            const weekStart = new Date(currentMonday);
            weekStart.setDate(currentMonday.getDate() - w * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            const kwNum = getISOWeekNumber(weekStart);
            const dateRange = `${weekStart.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })} – ${weekEnd.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' })}`;

            buckets.push({
                start: weekStart,
                end: weekEnd,
                label: `KW ${kwNum}`,
                dateRange,
                pages: 0,
            });
        }

        for (const entry of dailyActivity) {
            const d = new Date(entry.date);
            for (const bucket of buckets) {
                if (d >= bucket.start && d <= bucket.end) {
                    bucket.pages += entry.pagesRead;
                    break;
                }
            }
        }

        return buckets.map((bucket): WeeklyPaceDatum => ({
            name: bucket.label,
            pages: bucket.pages,
            dateRange: bucket.dateRange,
        }));
    }, [dailyActivity, i18n.language]);

    const totalPages = Math.ceil(weeklyData.length / PAGE_SIZE);
    const [page, setPage] = useState(totalPages - 1); // Start on last page (most recent)

    const visibleData = weeklyData.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

    const hasData = weeklyData.some((week) => week.pages > 0);

    if (!hasData) {
        return (
            <Flex h="160px" align="center" justify="center">
                <Text fontSize="sm" color="gray.500">{t('stats.weeklyPace.empty')}</Text>
            </Flex>
        );
    }

    const maxPages = Math.max(...weeklyData.map((week) => week.pages));

    return (
        <Box w="full">
            <Box h="180px">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart key={page} data={visibleData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#718096', fontSize: 10 }}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#718096', fontSize: 10 }}
                            width={40}
                            domain={[0, maxPages]}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                        <Bar
                            dataKey="pages"
                            fill="#81E6D9"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={32}
                            animationDuration={500}
                            animationBegin={0}
                            animationEasing="ease-out"
                        />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
            {totalPages > 1 && (
                <Flex justify="center" align="center" gap={3} mt={1}>
                    <IconButton
                        icon={<FaChevronLeft />}
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        aria-label="Previous weeks"
                        onClick={() => setPage((currentPage) => currentPage - 1)}
                        isDisabled={page === 0}
                    />
                    <IconButton
                        icon={<FaChevronRight />}
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        aria-label="Next weeks"
                        onClick={() => setPage((currentPage) => currentPage + 1)}
                        isDisabled={page === totalPages - 1}
                    />
                </Flex>
            )}
        </Box>
    );
};

export default WeeklyPaceChart;
