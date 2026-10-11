import { apiClient } from './apiClient';

export const ridesApi = {
  /**
   * Request a new ride
   */
  requestRide: async (rideData) => {
    return apiClient.post('/rides/request', rideData);
  },

  /**
   * Get details of a specific ride
   */
  getRide: async (rideId) => {
    return apiClient.get(`/rides/${rideId}`);
  },

  /**
   * Cancel an ongoing ride request
   */
  cancelRide: async (rideId, reason = 'Changed my mind') => {
    return apiClient.post(`/rides/${rideId}/cancel`, { reason });
  },

  /**
   * Fetch ride history for current user
   */
  getRideHistory: async (userId, page = 1, limit = 10) => {
    return apiClient.get(`/rides/history?userId=${userId}&page=${page}&limit=${limit}`);
  }
};
