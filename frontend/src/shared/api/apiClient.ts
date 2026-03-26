import type { ApiError, ApiHeaders, ApiRequestOptions } from '../types/http';

function getCsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    if (!match) return null;

    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

const getUserTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return 'UTC';
    }
};

async function request(url: string, options: ApiRequestOptions = {}): Promise<Response> {
    const headers: ApiHeaders = { 'X-Timezone': getUserTimezone(), ...options.headers };

    const method = (options.method || 'GET').toUpperCase();
    if (MUTATION_METHODS.includes(method as (typeof MUTATION_METHODS)[number])) {
        const csrfToken = getCsrfToken();
        if (csrfToken) {
            headers['X-XSRF-TOKEN'] = csrfToken;
        }
    }

    const config: RequestInit = {
        ...options,
        credentials: 'include',
        headers,
    };

    try {
        return await fetch(url, config);
    } catch {
        throw new Error('Network error. Please check your connection.');
    }
}

async function handleResponse<T>(response: Response): Promise<T | null> {
    if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        throw new Error('Unauthorized');
    }

    if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;

        try {
            const errorData = await response.json() as { message?: string };
            errorMessage = errorData.message || errorMessage;
        } catch {
            // Ignore JSON parse failures for non-JSON error responses.
        }

        const error: ApiError = new Error(errorMessage);
        error.status = response.status;
        throw error;
    }

    if (response.status === 204) {
        return null;
    }

    return response.json() as Promise<T>;
}

async function requestJson<T>(url: string, options: ApiRequestOptions = {}): Promise<T | null> {
    const response = await request(url, options);
    return handleResponse<T>(response);
}

const apiClient = {
    request,
    requestJson,
    handleResponse,
    get<T>(url: string, options: ApiRequestOptions = {}): Promise<T | null> {
        return requestJson<T>(url, { ...options, method: 'GET' });
    },
    post<TResponse, TBody = unknown>(
            url: string,
            data?: TBody | null,
            options: ApiRequestOptions = {}): Promise<TResponse | null> {
        return requestJson<TResponse>(url, {
            ...options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...options.headers },
            body: data ? JSON.stringify(data) : undefined,
        });
    },
    patch<TResponse, TBody = unknown>(
            url: string,
            data?: TBody | null,
            options: ApiRequestOptions = {}): Promise<TResponse | null> {
        return requestJson<TResponse>(url, {
            ...options,
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...options.headers },
            body: data ? JSON.stringify(data) : undefined,
        });
    },
    delete<T>(url: string, options: ApiRequestOptions = {}): Promise<T | null> {
        return requestJson<T>(url, { ...options, method: 'DELETE' });
    },
};

export default apiClient;
