import apiClient from '../../../shared/api/apiClient';
import type { AuthResponse, RegisterResponse, SessionResponse } from '../../../shared/types/auth';

type LoginRequest = {
    email: string;
    password: string;
};

type RegisterRequest = LoginRequest;

export const authApi = {
    login: (email: string, password: string) =>
        apiClient.post<AuthResponse, LoginRequest>('/api/auth/login', { email, password }),
    register: (email: string, password: string) =>
        apiClient.post<RegisterResponse, RegisterRequest>('/api/auth/register', { email, password }),
    getSession: () => apiClient.get<SessionResponse>('/api/auth/session'),
    logout: () => apiClient.post<null>('/api/auth/logout'),
};
