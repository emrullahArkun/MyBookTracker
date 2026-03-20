const apiClient = {
    async request(url, options = {}) {
        const config = {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        const response = await fetch(url, config);
        return response;
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
            body: data ? JSON.stringify(data) : undefined
        });
    },

    patch(url, data, options = {}) {
        return this.requestJson(url, {
            ...options,
            method: 'PATCH',
            body: data ? JSON.stringify(data) : undefined
        });
    },

    delete(url, options = {}) {
        return this.requestJson(url, { ...options, method: 'DELETE' });
    }
};

export default apiClient;
