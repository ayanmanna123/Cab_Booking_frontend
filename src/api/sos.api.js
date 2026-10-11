import { apiClient } from './apiClient';

export const sosApi = {
  /**
   * Trigger emergency SOS alert with current coordinates
   */
  triggerEmergency: async ({ userId, rideId, latitude, longitude, emergencyType = 'PANIC' }) => {
    return apiClient.post('/sos/trigger', {
      userId,
      rideId,
      latitude,
      longitude,
      emergencyType
    });
  }
};
