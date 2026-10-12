import React, { useState, useEffect } from 'react';
import LiveRideTracker from '../components/tracking/LiveRideTracker';
import { ridesApi } from '../api';

export default function RideTrackingPage({ ride: initialRide, onBackToHome }) {
  const [ride, setRide] = useState(initialRide);

  useEffect(() => {
    if (!initialRide) {
      ridesApi.getActiveRide()
        .then((res) => {
          if (res?.success && res.data) {
            const r = res.data;
            setRide({
              id: r.id,
              otp: r.otp,
              pickupCoords: [Number(r.pickup_latitude), Number(r.pickup_longitude)],
              dropoffCoords: [Number(r.dropoff_latitude), Number(r.dropoff_longitude)],
              driverName: r.driver?.full_name,
              driverPhone: r.driver?.phone,
              licensePlate: r.driver?.driver_profile?.license_plate,
              vehicleModel: r.driver?.driver_profile?.vehicle_model
            });
          }
        })
        .catch(() => {});
    }
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
