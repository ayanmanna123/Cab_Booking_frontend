import React from 'react';
import LiveRideTracker from '../components/tracking/LiveRideTracker';

export default function RideTrackingPage({ ride, onBackToHome }) {
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
