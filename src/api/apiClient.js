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

    // Extract credentials: distinguish driver actions from rider actions
    let authHeaders = {};
    try {
      const isDriverPath = typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/driver') || window.location.pathname.startsWith('/dashboard'));
      
      const isDriverEndpoint = 
        endpoint.includes('/accept') ||
        endpoint.includes('/arrive') ||
        endpoint.includes('/verify-pin') ||
        endpoint.includes('/complete') ||
        endpoint.includes('/reject') ||
        endpoint.startsWith('/drivers');

      const isDriver = isDriverPath || isDriverEndpoint;

      let registeredDriver = null;
      try {
        registeredDriver = JSON.parse(localStorage.getItem('registered_driver') || 'null');
      } catch {}

      let authUser = null;
      try {
        authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
      } catch {}

      if (isDriver) {
        // Driver identity (separate from rider to prevent role/user collisions)
        const driverId = registeredDriver?.id || registeredDriver?.user_id || 'driver_partner_official';
        const driverName = registeredDriver?.fullName || registeredDriver?.full_name || 'Vikram Malhotra';
        const driverEmail = registeredDriver?.email || 'driver.partner@uberclone.local';
        const driverPhone = registeredDriver?.phone || '+91 98765 43210';

        authHeaders = {
          'Authorization': `Bearer ${driverId}`,
          'x-user-id': driverId,
          'x-user-email': driverEmail,
          'x-user-name': driverName,
          'x-user-phone': driverPhone,
          'x-user-role': 'driver'
        };
      } else if (authUser && authUser.id) {
        authHeaders = {
          'Authorization': `Bearer ${authUser.id}`,
          'x-user-id': authUser.id,
          'x-user-email': authUser.email || '',
          'x-user-name': authUser.fullName || '',
          'x-user-phone': authUser.phone || '',
          'x-user-avatar': authUser.avatarUrl || '',
          'x-user-role': 'rider'
        };
      } else {
        // Fallback rider identity
        authHeaders = {
          'Authorization': 'Bearer rider_official_user',
          'x-user-id': 'rider_official_user',
          'x-user-email': 'rider@uberclone.local',
          'x-user-name': 'Uber Rider',
          'x-user-role': 'rider'
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

  patch(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers
    });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
