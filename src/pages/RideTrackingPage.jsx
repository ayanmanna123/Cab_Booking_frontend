import React, { useState, useEffect } from 'react';
import LiveRideTracker from '../components/tracking/LiveRideTracker';
import { ridesApi } from '../api';

export default function RideTrackingPage({ ride: initialRide, onBackToHome }) {
  const [ride, setRide] = useState(initialRide);

  useEffect(() => {
    let isMounted = true;

    const parseRideDetails = (r) => {
      if (!r) return null;
      const d = r.driver || {};
      const du = d.driver_user || (typeof d.driver === 'object' ? d.driver : {});
      const dp = d.driver_profile || d;

      // Extract coords safely
      const pLat = Number(r.pickup_latitude || r.pickupLatitude) || 22.6113;
      const pLng = Number(r.pickup_longitude || r.pickupLongitude) || 88.4202;
      const dLat = Number(r.dropoff_latitude || r.dropoffLatitude) || 22.5804;
      const dLng = Number(r.dropoff_longitude || r.dropoffLongitude) || 88.4378;

      return {
        id: r.id || r.rideId,
        status: r.status || 'IN_PROGRESS',
        otp: r.otp || r.otp_code,
        pickupAddress: r.pickup_address || r.pickupAddress || 'Current Location',
        dropoffAddress: r.dropoff_address || r.dropoffAddress || 'Sector V, Bidhannagar',
        pickupCoords: [pLat, pLng],
        dropoffCoords: [dLat, dLng],
        driverCoords: [pLat, pLng],
        driverName: du.full_name || d.full_name || d.name || 'Verified Driver',
        driverPhone: du.phone || d.phone || '+91 98765 43210',
        driverUpiId: (
          d.upi_id ||
          dp.upi_id ||
          dp.upiId ||
          d.driverUpiId ||
          d.driver_upi_id ||
          du.upi_id ||
          localStorage.getItem('driver_registered_upi') ||
          (localStorage.getItem('driver_custom_upi') && localStorage.getItem('driver_custom_upi') !== 'vikram.cab@okhdfcbank' ? localStorage.getItem('driver_custom_upi') : null) ||
          'vikram.cab@okhdfcbank'
        ),
        licensePlate: dp.license_plate || dp.licensePlate || 'WB 02 AB 4488',
        vehicleModel: `${dp.vehicle_make || dp.vehicleMake || 'Toyota'} ${dp.vehicle_model || dp.vehicleModel || 'Camry'}`,
        vehicleColor: dp.vehicle_color || dp.vehicleColor || 'Silver Metallic',
        driverAvatar: du.avatar_url || d.avatar_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
        driverRating: Number(dp.rating || d.rating || 5.0),
        driverTrips: dp.total_trips || dp.total_rides || null,
        fare: r.final_fare || r.estimated_fare || r.estimatedFare || '185.00'
      };
    };

    const fetchRide = async () => {
      try {
        const res = await ridesApi.getActiveRide();
        if (res?.success && res.data && isMounted) {
          const parsed = parseRideDetails(res.data);
          setRide(parsed);
          return;
        }
      } catch { }

      // Fallback to local storage if API request is pending or mock mode
      if (isMounted) {
        try {
          const savedActive = JSON.parse(localStorage.getItem('driver_active_ride') || 'null');
          const savedDriver = JSON.parse(localStorage.getItem('uber_active_accepted_driver') || 'null');
          if (savedActive) {
            setRide(parseRideDetails({
              ...savedActive,
              driver: savedDriver || savedActive.driver
            }));
          }
        } catch { }
      }
    };

    fetchRide();
    const interval = setInterval(fetchRide, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [initialRide]);

  return (
    <div className="min-h-[calc(100vh-140px)] bg-black text-white">
      <LiveRideTracker
        ride={ride}
        onCancel={onBackToHome}
        onComplete={onBackToHome}
      />
    </div>
  );
}
