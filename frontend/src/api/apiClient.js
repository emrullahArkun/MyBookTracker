function getCsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    if (!match) return null;
    try {
        return decodeURIComponent(match[1]);
    } catch {
        return match[1];
    }
}

const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

const apiClient = {
    async request(url, options = {}) {
        const headers = { ...options.headers };

        const method = (options.method || 'GET').toUpperCase();
        if (MUTATION_METHODS.includes(method)) {
            const csrfToken = getCsrfToken();
            if (csrfToken) {
                headers['X-XSRF-TOKEN'] = csrfToken;
            }
        }

        const config = {
            ...options,
            credentials: 'include',
            headers,
        };

        try {
            return await fetch(url, config);
        } catch (error) {
            throw new Error('Network error. Please check your connection.');
        }
    },

    async requestJson(url, options = {}) {
        const response = await this.request(url, options);
        return this.handleResponse(response);
    },

    async handleResponse(response) {
        if (response.status === 401) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
            throw new Error('Unauthorized');
        }

        if (!response.ok) {
            let errorMessage = `HTTP Error ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Ignore json parse error for error response
            }
            const error = new Error(errorMessage);
            error.status = response.status;
            throw error;
        }

        if (response.status === 204) {
            return null;
        }

        return response.json();
    },

    get(url, options = {}) {
        return this.requestJson(url, { ...options, method: 'GET' });
    },

    post(url, data, options = {}) {
        return this.requestJson(url, {
            ...options,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...options.headers },
            body: data ? JSON.stringify(data) : undefined
        });
    },

    patch(url, data, options = {}) {
        return this.requestJson(url, {
            ...options,
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', ...options.headers },
            body: data ? JSON.stringify(data) : undefined
        });
    },

    delete(url, options = {}) {
        return this.requestJson(url, { ...options, method: 'DELETE' });
    }
};

export default apiClient;
