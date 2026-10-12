import { apiClient } from './apiClient';

export const ridesApi = {
  /**
   * Calculate fare estimates for supported vehicle categories
   */
  estimateFare: async (data) => {
    return apiClient.post('/rides/estimate', data);
  },

  /**
   * Request / book a new ride
   */
  requestRide: async (rideData) => {
    return apiClient.post('/rides', rideData);
  },

  /**
   * Get currently active ride for user / driver
   */
  getActiveRide: async () => {
    return apiClient.get('/rides/active');
  },

  /**
   * Get details of a specific ride
   */
  getRide: async (rideId) => {
    return apiClient.get(`/rides/${rideId}`);
  },

  /**
   * Accept an incoming ride request (driver)
   */
  acceptRide: async (rideId) => {
    return apiClient.post(`/rides/${rideId}/accept`);
  },

  /**
   * Reject / decline an incoming ride request (driver)
   */
  rejectRide: async (rideId) => {
    return apiClient.post(`/rides/${rideId}/reject`);
  },

  /**
   * Driver marks arrived at pickup location
   */
  arriveRide: async (rideId) => {
    return apiClient.post(`/rides/${rideId}/arrive`);
  },

  /**
   * Driver verifies passenger PIN and starts trip
   */
  verifyPin: async (rideId, pin) => {
    return apiClient.post(`/rides/${rideId}/verify-pin`, { pin, otp: pin });
  },

  /**
   * Driver completes trip at destination
   */
  completeRide: async (rideId) => {
    return apiClient.post(`/rides/${rideId}/complete`);
  },

  /**
   * Cancel an ongoing ride request
   */
  cancelRide: async (rideId, reason = 'Changed my mind') => {
    return apiClient.post(`/rides/${rideId}/cancel`, { reason });
  },

  /**
   * Generic status updater (backwards-compatible)
   */
  updateStatus: async (rideId, status, otp = undefined) => {
    return apiClient.patch(`/rides/${rideId}/status`, { status, otp });
  },

  /**
   * Fetch ride history for current user or driver (both completed and running)
   */
  getRideHistory: async (page = 1, limit = 20, status = null) => {
    const offset = (page - 1) * limit;
    let url = `/rides/history?limit=${limit}&offset=${offset}`;
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    return apiClient.get(url);
  },

  /**
   * Fetch dedicated rider ride history
   */
  getRiderHistory: async (page = 1, limit = 20, status = null) => {
    const offset = (page - 1) * limit;
    let url = `/rides/history/rider?limit=${limit}&offset=${offset}`;
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    return apiClient.get(url);
  }
};
