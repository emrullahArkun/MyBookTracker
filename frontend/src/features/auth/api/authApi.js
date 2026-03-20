import apiClient from '../../../api/apiClient';

export const authApi = {
    login: (email, password) => apiClient.post('/api/auth/login', { email, password }),
    register: (email, password) => apiClient.post('/api/auth/register', { email, password }),
    getSession: () => apiClient.get('/api/auth/session'),
    logout: () => apiClient.post('/api/auth/logout'),
};
