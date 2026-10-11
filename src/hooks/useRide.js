import { useRideContext } from '../context/RideContext';
import { faresApi, ridesApi, promosApi } from '../api';

/**
 * Custom hook providing ride booking domain actions
 */
export function useRide() {
  const rideContext = useRideContext();

  const calculateRouteAndFares = async (pickupCoords, dropoffCoords, promoCode = '') => {
    try {
      // 1. Fetch Leaflet/OSRM route polyline
      const routeRes = await faresApi.getRoute({
        pickupLat: pickupCoords[0],
        pickupLng: pickupCoords[1],
        dropoffLat: dropoffCoords[0],
        dropoffLng: dropoffCoords[1]
      });

      // 2. Fetch fare estimates for all vehicle tiers
      const fareRes = await faresApi.calculateFare({
        pickupLat: pickupCoords[0],
        pickupLng: pickupCoords[1],
        dropoffLat: dropoffCoords[0],
        dropoffLng: dropoffCoords[1],
        promoCode
      });

      if (routeRes.success && fareRes.success) {
        rideContext.setRoute({
          pickupCoords,
          dropoffCoords,
          coordinates: routeRes.data.coordinates,
          meta: {
            distanceKm: routeRes.data.distanceKm,
            durationMinutes: routeRes.data.durationMinutes
          }
        });
        rideContext.setFares(fareRes.data.fares);
        return {
          route: routeRes.data,
          fares: fareRes.data.fares
        };
      }
    } catch (err) {
      console.error('Failed to calculate route & fares:', err);
      throw err;
    }
  };

  const applyPromo = async (code, fareAmount) => {
    try {
      const res = await promosApi.validatePromo(code, fareAmount);
      if (res.success) {
        rideContext.setAppliedPromo(res.data);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to validate promo code:', err);
      throw err;
    }
  };

  return {
    ...rideContext,
    calculateRouteAndFares,
    applyPromo
  };
}
