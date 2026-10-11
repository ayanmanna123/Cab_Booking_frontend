import React, { createContext, useContext, useState } from 'react';
import { RIDE_STATUS } from '../constants/rideConstants';

const RideContext = createContext(null);

export function RideProvider({ children }) {
  const [pickup, setPickup] = useState({
    address: 'Market St, San Francisco, CA',
    coords: [37.7749, -122.4194]
  });

  const [dropoff, setDropoff] = useState({
    address: '',
    coords: null
  });

  const [selectedVehicle, setSelectedVehicle] = useState('UberX');
  const [fares, setFares] = useState([]);
  const [routePolyline, setRoutePolyline] = useState([]);
  const [routeMeta, setRouteMeta] = useState({ distanceKm: 0, durationMinutes: 0 });
  const [appliedPromo, setAppliedPromo] = useState(null);

  // Active Ride state machine
  const [activeRide, setActiveRide] = useState(null);

  const setRoute = ({ pickupCoords, dropoffCoords, coordinates, meta, pickupAddress, dropoffAddress }) => {
    if (pickupCoords) {
      setPickup(prev => ({ ...prev, coords: pickupCoords, address: pickupAddress || prev.address }));
    }
    if (dropoffCoords) {
      setDropoff(prev => ({ ...prev, coords: dropoffCoords, address: dropoffAddress || prev.address }));
    }
    if (coordinates) {
      setRoutePolyline(coordinates);
    }
    if (meta) {
      setRouteMeta(meta);
    }
  };

  const updateRideStatus = (status, extraData = {}) => {
    setActiveRide(prev => {
      if (!prev) return null;
      return {
        ...prev,
        status,
        ...extraData
      };
    });
  };

  const startNewRide = (rideData) => {
    setActiveRide({
      id: rideData.id,
      status: rideData.status || RIDE_STATUS.SEARCHING,
      pickup: pickup,
      dropoff: dropoff,
      vehicleTier: selectedVehicle,
      estimatedFare: rideData.fare,
      otpCode: rideData.otp_code || '4829',
      driver: rideData.driver || null,
      createdAt: new Date().toISOString(),
      ...rideData
    });
  };

  const clearActiveRide = () => {
    setActiveRide(null);
  };

  return (
    <RideContext.Provider
      value={{
        pickup,
        setPickup,
        dropoff,
        setDropoff,
        selectedVehicle,
        setSelectedVehicle,
        fares,
        setFares,
        routePolyline,
        setRoutePolyline,
        routeMeta,
        setRouteMeta,
        appliedPromo,
        setAppliedPromo,
        activeRide,
        setActiveRide,
        startNewRide,
        updateRideStatus,
        clearActiveRide,
        setRoute
      }}
    >
      {children}
    </RideContext.Provider>
  );
}

export function useRideContext() {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRideContext must be used within a RideProvider');
  }
  return context;
}
