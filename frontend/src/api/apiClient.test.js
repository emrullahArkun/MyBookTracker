import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import apiClient from './apiClient';

describe('apiClient', () => {
    let originalFetch;

    beforeEach(() => {
        originalFetch = global.fetch;
        global.fetch = vi.fn();

        // Mock window.dispatchEvent
        vi.spyOn(window, 'dispatchEvent').mockImplementation(() => {});
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    // ==================== request() ====================

    describe('request()', () => {
        it('should add Content-Type header and credentials by default', async () => {
            global.fetch.mockResolvedValue({ ok: true });
            await apiClient.request('/api/test');

            expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                credentials: 'include',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                }),
            }));
        });

        it('should merge custom headers with defaults', async () => {
            global.fetch.mockResolvedValue({ ok: true });
            await apiClient.request('/api/test', {
                headers: { 'X-Custom': 'value' },
            });

            expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    'X-Custom': 'value',
                }),
            }));
        });

        it('should throw on fetch failure', async () => {
            const error = new Error('Network error');
            global.fetch.mockRejectedValue(error);

            await expect(apiClient.request('/api/test')).rejects.toThrow('Network error');
        });
    });

    // ==================== handleResponse() ====================

    describe('handleResponse()', () => {
        it('should dispatch event on 401', async () => {
            const response = { status: 401, ok: false };

            await expect(apiClient.handleResponse(response)).rejects.toThrow('Unauthorized');
            expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
        });

        it('should throw with error message from JSON on non-ok response', async () => {
            const response = {
                status: 400,
                ok: false,
                json: vi.fn().mockResolvedValue({ message: 'Bad request body' }),
            };

            await expect(apiClient.handleResponse(response)).rejects.toThrow('Bad request body');
        });

        it('should throw with default HTTP error when JSON parsing fails', async () => {
            const response = {
                status: 500,
                ok: false,
                json: vi.fn().mockRejectedValue(new Error('not json')),
            };

            await expect(apiClient.handleResponse(response)).rejects.toThrow('HTTP Error 500');
        });

        it('should throw with default HTTP error when JSON has no message', async () => {
            const response = {
                status: 422,
                ok: false,
                json: vi.fn().mockResolvedValue({}),
            };

            await expect(apiClient.handleResponse(response)).rejects.toThrow('HTTP Error 422');
        });

        it('should return null on 204 No Content', async () => {
            const response = { status: 204, ok: true };

            const result = await apiClient.handleResponse(response);
            expect(result).toBeNull();
        });

        it('should return parsed JSON on success', async () => {
            const data = { id: 1, name: 'Test' };
            const response = {
                status: 200,
                ok: true,
                json: vi.fn().mockResolvedValue(data),
            };

            const result = await apiClient.handleResponse(response);
            expect(result).toEqual(data);
        });

        it('should set status on error for non-ok responses', async () => {
            const response = {
                status: 403,
                ok: false,
                json: vi.fn().mockResolvedValue({ message: 'Forbidden' }),
            };

            try {
                await apiClient.handleResponse(response);
            } catch (error) {
                expect(error.status).toBe(403);
            }
        });
    });

    // ==================== requestJson() ====================

    describe('requestJson()', () => {
        it('should call request and handleResponse', async () => {
            const data = { id: 1 };
            global.fetch.mockResolvedValue({
                status: 200,
                ok: true,
                json: vi.fn().mockResolvedValue(data),
            });

            const result = await apiClient.requestJson('/api/test');
            expect(result).toEqual(data);
        });

        it('should rethrow errors', async () => {
            global.fetch.mockRejectedValue(new Error('Network error'));

            await expect(apiClient.requestJson('/api/test')).rejects.toThrow('Network error');
        });
    });

    // ==================== HTTP method shortcuts ====================

    describe('get()', () => {
        it('should call requestJson with GET method', async () => {
            global.fetch.mockResolvedValue({
                status: 200, ok: true,
                json: vi.fn().mockResolvedValue({ data: 'test' }),
            });

            await apiClient.get('/api/books');
            expect(global.fetch).toHaveBeenCalledWith('/api/books', expect.objectContaining({
                method: 'GET',
            }));
        });
    });

    describe('post()', () => {
        it('should call with POST method and body', async () => {
            global.fetch.mockResolvedValue({
                status: 200, ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await apiClient.post('/api/books', { title: 'Test' });
            expect(global.fetch).toHaveBeenCalledWith('/api/books', expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ title: 'Test' }),
            }));
        });

        it('should handle null data (no body)', async () => {
            global.fetch.mockResolvedValue({
                status: 200, ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await apiClient.post('/api/start', null);
            expect(global.fetch).toHaveBeenCalledWith('/api/start', expect.objectContaining({
                method: 'POST',
                body: undefined,
            }));
        });
    });

    describe('patch()', () => {
        it('should call with PATCH method and body', async () => {
            global.fetch.mockResolvedValue({
                status: 200, ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await apiClient.patch('/api/books/1', { page: 50 });
            expect(global.fetch).toHaveBeenCalledWith('/api/books/1', expect.objectContaining({
                method: 'PATCH',
                body: JSON.stringify({ page: 50 }),
            }));
        });

        it('should handle null data', async () => {
            global.fetch.mockResolvedValue({
                status: 200, ok: true,
                json: vi.fn().mockResolvedValue({}),
            });

            await apiClient.patch('/api/books/1', null);
            expect(global.fetch).toHaveBeenCalledWith('/api/books/1', expect.objectContaining({
                method: 'PATCH',
                body: undefined,
            }));
        });
    });

    describe('delete()', () => {
        it('should call with DELETE method', async () => {
            global.fetch.mockResolvedValue({
                status: 204, ok: true,
            });

            await apiClient.delete('/api/books/1');
            expect(global.fetch).toHaveBeenCalledWith('/api/books/1', expect.objectContaining({
                method: 'DELETE',
            }));
        });
    });
});
