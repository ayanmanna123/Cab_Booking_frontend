import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Car,
  Star,
  Phone,
  MessageSquare,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  Navigation
} from 'lucide-react';
import InteractiveMap from '../map/InteractiveMap';
import { sosApi } from '../../api';

export default function LiveRideTracker({
  ride,
  onCancel,
  onComplete
}) {
  const [driverCoords, setDriverCoords] = useState(
    ride?.driverCoords || [37.7780, -122.4170]
  );
  const [etaMinutes, setEtaMinutes] = useState(4);
  const [statusStep, setStatusStep] = useState(2); // 1: searching, 2: arriving, 3: in_progress, 4: completed
  const [sosActive, setSosActive] = useState(false);

  // Simulate driver moving towards pickup
  useEffect(() => {
    const interval = setInterval(() => {
      setDriverCoords(prev => [
        prev[0] + (Math.random() - 0.5) * 0.001,
        prev[1] + (Math.random() - 0.5) * 0.001
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleSos = async () => {
    setSosActive(true);
    try {
      await sosApi.triggerEmergency({
        userId: ride?.riderId || 'rider_live',
        rideId: ride?.id || 'live_ride_123',
        latitude: driverCoords[0],
        longitude: driverCoords[1],
        emergencyType: 'PANIC'
      });
    } catch (e) {
      console.warn('Simulated SOS');
    }
  };

  const steps = [
    { id: 1, label: 'Driver Assigned' },
    { id: 2, label: 'Driver Arriving' },
    { id: 3, label: 'On Trip' },
    { id: 4, label: 'Dropoff' }
  ];

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 select-none">
      {/* Header & Status Stepper */}
      <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-2xl font-black text-white">Ride in Progress</h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Your driver is en route. Please meet them at the designated pickup point.
            </p>
          </div>

          {/* Emergency SOS button */}
          <button
            onClick={handleSos}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition cursor-pointer ${
              sosActive
                ? 'bg-red-700 text-white animate-pulse'
                : 'bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white border border-red-500/30'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{sosActive ? '🚨 SOS Alert Dispatched' : 'Emergency SOS'}</span>
          </button>
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {steps.map(step => (
            <div key={step.id} className="space-y-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  step.id <= statusStep ? 'bg-white' : 'bg-neutral-800'
                }`}
              />
              <span
                className={`text-[11px] font-semibold block truncate ${
                  step.id <= statusStep ? 'text-white' : 'text-neutral-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Driver Info + Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Driver Card & Ride PIN */}
        <div className="lg:col-span-5 space-y-6">
          {/* Driver Card */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
                    alt="Driver avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Marcus Vance</h3>
                  <div className="flex items-center space-x-1.5 text-xs text-neutral-400">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-white">4.96</span>
                    <span>· 1,420 trips</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-neutral-400 block">Arriving in</span>
                <span className="text-2xl font-black text-emerald-400">{etaMinutes} min</span>
              </div>
            </div>

            {/* Vehicle & Plate Info */}
            <div className="bg-black p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 block font-medium">Toyota Camry · Silver</span>
                <span className="text-xl font-mono font-black text-white tracking-wider">
                  CA · 7XYZ892
                </span>
              </div>
              <div className="bg-neutral-900 p-3 rounded-xl">
                <Car className="w-6 h-6 text-neutral-300" />
              </div>
            </div>

            {/* OTP Code PIN */}
            <div className="bg-amber-400/10 border border-amber-400/20 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                  Share PIN with Driver
                </span>
                <span className="text-xs text-neutral-300">Driver must verify this PIN to start ride</span>
              </div>
              <span className="text-2xl font-mono font-black text-amber-400 tracking-widest bg-black px-3 py-1 rounded-xl">
                {ride?.otp || '4829'}
              </span>
            </div>

            {/* Contact buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer">
                <Phone className="w-4 h-4" />
                <span>Call Driver</span>
              </button>
              <button className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer">
                <MessageSquare className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </div>

            {/* Cancel ride */}
            {onCancel && (
              <button
                onClick={onCancel}
                className="w-full py-2.5 text-xs font-semibold text-neutral-400 hover:text-red-400 transition cursor-pointer"
              >
                Cancel ride
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Leaflet Map */}
        <div className="lg:col-span-7">
          <InteractiveMap
            pickupCoords={ride?.pickupCoords || [37.7749, -122.4194]}
            dropoffCoords={ride?.dropoffCoords || [37.8080, -122.4177]}
            height="560px"
            nearbyDrivers={[
              {
                id: 'my_driver',
                vehicle_model: 'Marcus Vance (Toyota Camry)',
                latitude: driverCoords[0],
                longitude: driverCoords[1],
                rating: 4.96
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
