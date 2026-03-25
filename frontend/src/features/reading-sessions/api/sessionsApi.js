import apiClient from '../../../api/apiClient';

export const sessionsApi = {
    getActive: () => apiClient.get('/api/sessions/active'),
    getByBookId: (bookId) => apiClient.get(`/api/sessions/book/${bookId}`),
    start: (bookId) => apiClient.post('/api/sessions/start', { bookId }),
    stop: (endTime, endPage) => {
        const body = {};
        if (endTime) body.endTime = endTime.toISOString();
        if (endPage !== undefined) body.endPage = endPage;
        return apiClient.post('/api/sessions/stop', body);
    },
    pause: () => apiClient.post('/api/sessions/active/pause'),
    resume: () => apiClient.post('/api/sessions/active/resume'),
    excludeTime: (millis) => apiClient.post('/api/sessions/active/exclude-time', { millis }),
};
