import { CONFIG } from '../constants/config';

/**
 * Standard HTTP client with JSON serialization and uniform error handling.
 */
class ApiClient {
  constructor(baseURL = CONFIG.BACKEND_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    // Extract logged in user credentials if present
    let authHeaders = {};
    try {
      const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
      if (authUser && authUser.id) {
        authHeaders = {
          'Authorization': `Bearer ${authUser.id}`,
          'x-user-id': authUser.id,
          'x-user-email': authUser.email || '',
          'x-user-name': authUser.fullName || '',
          'x-user-phone': authUser.phone || '',
          'x-user-avatar': authUser.avatarUrl || ''
        };
      }
    } catch {
      // Ignore
    }

    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data?.message || `HTTP error: ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
      throw err;
    }
  }

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers
    });
  }

  put(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers
    });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
