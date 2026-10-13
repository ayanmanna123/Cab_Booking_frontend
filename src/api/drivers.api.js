import { apiClient } from './apiClient';

const getAuthToken = (explicitToken) => {
  if (explicitToken && explicitToken !== 'rider_official_user') return explicitToken;
  try {
    const authUser = JSON.parse(localStorage.getItem('auth_user') || 'null');
    return authUser?.id || 'guest_user';
  } catch {
    return 'guest_user';
  }
};

export const driversApi = {
  /**
   * Register or update driver profile
   */
  registerDriver: async (driverData, token) => {
    const resolvedToken = getAuthToken(token);
    return apiClient.post('/drivers/register', driverData, {
      Authorization: `Bearer ${resolvedToken}`
    });
  },

  /**
   * Update driver payout method and UPI ID
   */
  updatePayout: async (payoutData, token) => {
    const resolvedToken = getAuthToken(token);
    return apiClient.patch('/drivers/payout', payoutData, {
      Authorization: `Bearer ${resolvedToken}`
    });
  },

  /**
   * Get current driver profile
   */
  getMyProfile: async (token) => {
    const resolvedToken = getAuthToken(token);
    return apiClient.get('/drivers/me', {
      Authorization: `Bearer ${resolvedToken}`
    });
  },

  /**
   * Find nearby online drivers within a given radius
   */
  getNearbyDrivers: async (latitude, longitude, radiusKm = 15) => {
    return apiClient.get(`/drivers/nearby?latitude=${latitude}&longitude=${longitude}&radiusKm=${radiusKm}&lat=${latitude}&lng=${longitude}`);
  },

  /**
   * Toggle driver online / offline availability
   */
  toggleStatus: async (driverId, isOnline) => {
    return apiClient.patch('/drivers/availability', { isOnline, driverId });
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
    return apiClient.patch('/drivers/location', {
      latitude,
      longitude,
      heading,
      driverId
    });
  },

  /**
   * Upload custom car image directly into Supabase car-images bucket
   */
  uploadCarImage: async (imageBase64, mimeType = 'image/jpeg') => {
    return apiClient.post('/drivers/upload-car-image', { imageBase64, mimeType });
  }
};
