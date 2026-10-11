import { apiClient } from './apiClient';

export const faresApi = {
  /**
   * Calculate fare estimates for all vehicle types
   */
  calculateFare: async ({ pickupLat, pickupLng, dropoffLat, dropoffLng, promoCode }) => {
    return apiClient.post('/fares/calculate', {
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      promoCode: promoCode || null
    });
  },

  /**
   * Fetch Leaflet/OSRM turn-by-turn road polyline
   */
  getRoute: async ({ pickupLat, pickupLng, dropoffLat, dropoffLng }) => {
    return apiClient.post('/fares/route', {
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng
    });
  }
};
