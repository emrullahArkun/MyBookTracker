import apiClient from '../../../shared/api/apiClient';
import type { Achievement, StatsOverview } from '../../../shared/types/stats';

const statsApi = {
    getOverview: () => apiClient.get<StatsOverview>('/api/stats/overview'),
    getAchievements: () => apiClient.get<Achievement[]>('/api/stats/achievements'),
};

export default statsApi;
