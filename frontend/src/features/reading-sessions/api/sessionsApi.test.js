import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sessionsApi } from './sessionsApi';
import apiClient from '../../../api/apiClient';

vi.mock('../../../api/apiClient', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

describe('sessionsApi', () => {
    beforeEach(() => vi.clearAllMocks());

    it('getActive should GET active session', async () => {
        apiClient.get.mockResolvedValue(null);
        await sessionsApi.getActive();
        expect(apiClient.get).toHaveBeenCalledWith('/api/sessions/active');
    });

    it('getByBookId should GET by bookId', async () => {
        apiClient.get.mockResolvedValue([]);
        await sessionsApi.getByBookId(5);
        expect(apiClient.get).toHaveBeenCalledWith('/api/sessions/book/5');
    });

    it('start should POST with bookId', async () => {
        apiClient.post.mockResolvedValue({ id: 1 });
        await sessionsApi.start(10);
        expect(apiClient.post).toHaveBeenCalledWith('/api/sessions/start', { bookId: 10 });
    });

    it('stop should POST with endTime and endPage', async () => {
        const date = new Date('2025-01-01T12:00:00Z');
        await sessionsApi.stop(date, 50);
        expect(apiClient.post).toHaveBeenCalledWith('/api/sessions/stop', {
            endTime: '2025-01-01T12:00:00.000Z',
            endPage: 50,
        });
    });

    it('stop should omit endTime when null', async () => {
        await sessionsApi.stop(null, 50);
        expect(apiClient.post).toHaveBeenCalledWith('/api/sessions/stop', { endPage: 50 });
    });

    it('stop should omit endPage when undefined', async () => {
        const date = new Date('2025-01-01T12:00:00Z');
        await sessionsApi.stop(date, undefined);
        expect(apiClient.post).toHaveBeenCalledWith('/api/sessions/stop', {
            endTime: '2025-01-01T12:00:00.000Z',
        });
    });

    it('stop should include endPage when 0', async () => {
        await sessionsApi.stop(null, 0);
        expect(apiClient.post).toHaveBeenCalledWith('/api/sessions/stop', { endPage: 0 });
    });

    it('pause should POST', async () => {
        await sessionsApi.pause();
        expect(apiClient.post).toHaveBeenCalledWith('/api/sessions/active/pause');
    });

    it('resume should POST', async () => {
        await sessionsApi.resume();
        expect(apiClient.post).toHaveBeenCalledWith('/api/sessions/active/resume');
    });

    it('excludeTime should POST with millis', async () => {
        await sessionsApi.excludeTime(5000);
        expect(apiClient.post).toHaveBeenCalledWith('/api/sessions/active/exclude-time', { millis: 5000 });
    });
});
