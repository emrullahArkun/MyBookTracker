import apiClient from '../../../shared/api/apiClient';
import type {
    ExcludeTimeRequest,
    ReadingSession,
    StartSessionRequest,
    StopSessionRequest,
} from '../../../shared/types/sessions';

export const sessionsApi = {
    getActive: () => apiClient.get<ReadingSession>('/api/sessions/active'),
    getByBookId: (bookId: number) => apiClient.get<ReadingSession[]>(`/api/sessions/book/${bookId}`),
    start: (bookId: number) => apiClient.post<ReadingSession, StartSessionRequest>('/api/sessions/start', { bookId }),
    stop: (endTime: Date | null, endPage?: number) => {
        const body: StopSessionRequest = {};
        if (endTime) body.endTime = endTime.toISOString();
        if (endPage !== undefined) body.endPage = endPage;
        return apiClient.post<ReadingSession, StopSessionRequest>('/api/sessions/stop', body);
    },
    pause: () => apiClient.post<ReadingSession>('/api/sessions/active/pause'),
    resume: () => apiClient.post<ReadingSession>('/api/sessions/active/resume'),
    excludeTime: (millis: number) =>
        apiClient.post<ReadingSession, ExcludeTimeRequest>('/api/sessions/active/exclude-time', { millis }),
};
