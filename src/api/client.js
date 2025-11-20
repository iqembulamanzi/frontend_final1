import { API_CONFIG } from './config.js';

class ApiClient {
  constructor(config) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout;
    this.retries = config.retries;
    this.retryDelay = config.retryDelay;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const config = {
          ...options,
          signal: controller.signal
        };

        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Server may be experiencing high load.');
        }

        if (attempt === this.retries) {
          throw error;
        }

        // Exponential backoff
        await new Promise(resolve =>
          setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1))
        );
      }
    }
  }

  get(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'GET',
      headers: {
        ...this.getAuthHeaders(),
        ...headers
      }
    });
  }

  post(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        ...headers
      },
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeaders(),
        ...headers
      },
      body: JSON.stringify(data)
    });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeaders(),
        ...headers
      }
    });
  }

  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }
}

export const apiClient = new ApiClient(API_CONFIG);