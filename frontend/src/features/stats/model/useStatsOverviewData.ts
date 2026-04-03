import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth';
import { getStartOfLocalWeek, parseLocalDate } from '../../../shared/lib/date';
import statsApi from '../api/statsApi';
import type { DailyActivity, StatsOverview } from '../../../shared/types/stats';

export const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const formatShortDate = (dateString: string, language: string) => (
    parseLocalDate(dateString).toLocaleDateString(language, { day: 'numeric', month: 'short' })
);

const computeWeekStats = (dailyActivity: DailyActivity[]) => {
    const startOfWeek = getStartOfLocalWeek(new Date());
    const thisWeekEntries = dailyActivity.filter((entry) => parseLocalDate(entry.date) >= startOfWeek);
    const readingDaysThisWeek = thisWeekEntries.filter((entry) => entry.pagesRead > 0).length;
    const pagesThisWeek = thisWeekEntries.reduce((sum, entry) => sum + entry.pagesRead, 0);
    const averageReadingDay = readingDaysThisWeek > 0
        ? Math.round(pagesThisWeek / readingDaysThisWeek)
        : 0;

    return { readingDaysThisWeek, pagesThisWeek, averageReadingDay };
};

const findBestRecentDay = (dailyActivity: DailyActivity[]): DailyActivity | null => (
    dailyActivity.reduce<DailyActivity | null>((best, entry) => {
        if (entry.pagesRead <= 0) return best;
        if (!best || entry.pagesRead > best.pagesRead) return entry;
        return best;
    }, null)
);

export const useStatsOverviewData = () => {
    const { email, user } = useAuth();

    const { data: stats, isLoading: loading, isError, refetch } = useQuery<StatsOverview | null>({
        queryKey: ['stats', user?.email, 'overview'],
        queryFn: () => statsApi.getOverview(),
        enabled: !!email,
    });

    const dailyActivity = stats?.dailyActivity || [];
    const weekStats = stats ? computeWeekStats(dailyActivity) : null;
    const bestRecentDay = stats ? findBestRecentDay(dailyActivity) : null;
    const completedRatio = stats && stats.totalBooks > 0
        ? Math.round((stats.completedBooks / stats.totalBooks) * 100)
        : 0;

    return {
        stats,
        loading,
        isError,
        refetch,
        weekStats,
        bestRecentDay,
        completedRatio,
    };
};
