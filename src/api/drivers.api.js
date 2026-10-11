import { apiClient } from './apiClient';

export const driversApi = {
  /**
   * Find nearby online drivers within a given radius
   */
  getNearbyDrivers: async (latitude, longitude, radiusKm = 5) => {
    return apiClient.get(`/drivers/nearby?lat=${latitude}&lng=${longitude}&radius=${radiusKm}`);
  },

  /**
   * Toggle driver online / offline availability
   */
  toggleStatus: async (driverId, isOnline) => {
    return apiClient.put(`/drivers/${driverId}/status`, { isOnline });
  },

  /**
   * Driver response to incoming ride request (accept / decline)
   */
  respondToOffer: async (rideId, driverId, action) => {
    return apiClient.post(`/drivers/rides/${rideId}/respond`, {
      driverId,
      action // 'ACCEPT' or 'DECLINE'
    });
  },

  /**
   * Update live driver GPS location
   */
  updateLocation: async (driverId, latitude, longitude, heading = 0) => {
    return apiClient.put(`/drivers/${driverId}/location`, {
      latitude,
      longitude,
      heading
    });
  }
};
