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
  Navigation,
  ShieldCheck,
  Check
} from 'lucide-react';
import InteractiveMap from '../map/InteractiveMap';
import { sosApi } from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

export default function LiveRideTracker({
  ride,
  onCancel,
  onComplete
}) {
  const { socket } = useSocketContext();

  const initialStatusStep = () => {
    if (ride?.status === 'COMPLETED') return 4;
    if (ride?.status === 'IN_PROGRESS') return 3;
    if (ride?.status === 'ARRIVED') return 2;
    return 3; // Default for live trip tracking view once navigated
  };

  const [statusStep, setStatusStep] = useState(initialStatusStep);
  const [driverCoords, setDriverCoords] = useState(
    ride?.pickupCoords || [22.6113, 88.4202]
  );
  const [etaMinutes, setEtaMinutes] = useState(8);
  const [sosActive, setSosActive] = useState(false);
  const [tripCompleted, setTripCompleted] = useState(ride?.status === 'COMPLETED');

  // Synchronize statusStep if ride status updates from parent
  useEffect(() => {
    if (ride?.status === 'COMPLETED') {
      setStatusStep(4);
      setTripCompleted(true);
    } else if (ride?.status === 'IN_PROGRESS') {
      setStatusStep(3);
    } else if (ride?.status === 'ARRIVED') {
      setStatusStep(2);
    }
  }, [ride?.status]);

  // Update initial driver coords once ride coords are available
  useEffect(() => {
    if (ride?.pickupCoords && (!driverCoords || driverCoords[0] === 37.778)) {
      setDriverCoords(ride.pickupCoords);
    }
  }, [ride?.pickupCoords]);

  // Simulate smooth driver progress towards destination during trip
  useEffect(() => {
    if (statusStep >= 3 && !tripCompleted && ride?.dropoffCoords) {
      const interval = setInterval(() => {
        setDriverCoords(prev => {
          const target = ride.dropoffCoords;
          const dLat = (target[0] - prev[0]) * 0.05;
          const dLng = (target[1] - prev[1]) * 0.05;
          return [prev[0] + dLat, prev[1] + dLng];
        });
        setEtaMinutes(m => (m > 1 ? m - 1 : 1));
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [statusStep, tripCompleted, ride?.dropoffCoords]);

  // Listen to socket and broadcast channel for real-time completion
  useEffect(() => {
    const handleCompletion = () => {
      console.log('🎉 Ride completed by driver!');
      setStatusStep(4);
      setTripCompleted(true);
      if (ride?.dropoffCoords) {
        setDriverCoords(ride.dropoffCoords);
      }
    };

    if (socket) {
      socket.on(SOCKET_EVENTS.RIDE_COMPLETED, handleCompletion);
      socket.on(SOCKET_EVENTS.RIDE_STATUS_CHANGE, (data) => {
        if (data?.status === 'COMPLETED') handleCompletion();
      });
    }

    let channel = null;
    try {
      channel = new BroadcastChannel('uber_dispatch_channel');
      channel.onmessage = (e) => {
        if (e.data?.type === 'RIDE_COMPLETED') {
          handleCompletion();
        }
      };
    } catch {}

    const customComplete = () => handleCompletion();
    window.addEventListener('uber_ride_completed', customComplete);

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.RIDE_COMPLETED, handleCompletion);
        socket.off(SOCKET_EVENTS.RIDE_STATUS_CHANGE);
      }
      if (channel) channel.close();
      window.removeEventListener('uber_ride_completed', customComplete);
    };
  }, [socket, ride?.dropoffCoords]);

  const handleSos = async () => {
    setSosActive(true);
    try {
      await sosApi.triggerEmergency({
        userId: ride?.id || 'rider_live',
        rideId: ride?.id || 'live_ride_123',
        latitude: driverCoords[0],
        longitude: driverCoords[1],
        emergencyType: 'PANIC'
      });
    } catch (e) {
      console.warn('Simulated SOS triggered');
    }
  };

  const steps = [
    { id: 1, label: 'Driver Assigned' },
    { id: 2, label: 'Driver Arrived' },
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
              <span className={`w-2.5 h-2.5 rounded-full ${tripCompleted ? 'bg-emerald-400' : 'bg-emerald-400 animate-ping'}`} />
              <h2 className="text-2xl font-black text-white">
                {tripCompleted ? 'Trip Completed' : statusStep >= 3 ? 'On Trip to Destination' : 'Driver En Route'}
              </h2>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {tripCompleted
                ? 'You have safely arrived at your destination. Thank you for riding with Uber!'
                : statusStep >= 3
                ? `En route to ${ride?.dropoffAddress || 'Sector V, Bidhannagar'}. PIN verified.`
                : 'Your driver has arrived at the pickup point.'}
            </p>
          </div>

          {/* Emergency SOS button */}
          {!tripCompleted && (
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
          )}
        </div>

        {/* Stepper */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {steps.map(step => (
            <div key={step.id} className="space-y-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  step.id <= statusStep ? 'bg-emerald-400' : 'bg-neutral-800'
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
        {/* Left Column: Driver Card & Trip Status (OTP Removed) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Driver Card */}
          <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-neutral-700 bg-neutral-800">
                  <img
                    src={ride?.driverAvatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"}
                    alt="Driver avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {ride?.driverName || 'Verified Driver'}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-neutral-400">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="font-bold text-white">{ride?.driverRating || 4.98}</span>
                    <span>· {ride?.driverTrips || '1,240'} trips</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-neutral-400 block">
                  {tripCompleted ? 'Status' : 'Est. Dropoff'}
                </span>
                <span className="text-2xl font-black text-emerald-400">
                  {tripCompleted ? 'Done' : `${etaMinutes} min`}
                </span>
              </div>
            </div>

            {/* Vehicle & Plate Info */}
            <div className="bg-black p-4 rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-neutral-400 block font-medium">
                  {ride?.vehicleModel || 'Toyota Camry'} · {ride?.vehicleColor || 'Silver'}
                </span>
                <span className="text-xl font-mono font-black text-white tracking-wider">
                  {ride?.licensePlate || 'WB 02 AB 4488'}
                </span>
              </div>
              <div className="bg-neutral-900 p-3 rounded-xl">
                <Car className="w-6 h-6 text-neutral-300" />
              </div>
            </div>

            {/* Trip Status Card (OTP section is REMOVED once PIN is entered & ride in progress) */}
            {tripCompleted ? (
              <div className="bg-emerald-950/50 border border-emerald-500/40 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Trip Successfully Completed</span>
                </div>
                <p className="text-xs text-neutral-300">
                  Fare: <strong className="text-white">₹{Number(ride?.fare || 185).toFixed(2)}</strong> paid via Cash/Online.
                </p>
                {onComplete && (
                  <button
                    type="button"
                    onClick={onComplete}
                    className="w-full mt-2 py-3 bg-white text-black font-extrabold text-xs rounded-xl hover:bg-neutral-200 transition cursor-pointer"
                  >
                    Back to Home
                  </button>
                )}
              </div>
            ) : statusStep >= 3 ? (
              /* PIN Verified Badge - Clean display with NO OTP box */
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block">
                      PIN Verified · On Trip
                    </span>
                    <span className="text-xs text-neutral-300 truncate max-w-[200px] block">
                      {ride?.dropoffAddress || 'Sector V, Bidhannagar'}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-neutral-300 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
                  ₹{Number(ride?.fare || 185).toFixed(2)}
                </span>
              </div>
            ) : null}

            {/* Contact buttons */}
            {!tripCompleted && (
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${ride?.driverPhone || '+919876543210'}`}
                  className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Driver</span>
                </a>
                <button
                  type="button"
                  onClick={() => alert(`Messaging ${ride?.driverName || 'driver'}: +91 98765 43210`)}
                  className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            )}

            {/* Trip Destination Details */}
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-neutral-400 mt-1 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Pickup</span>
                  <span className="text-neutral-200">{ride?.pickupAddress || 'Current Location (22.6113°, 88.4202°)'}</span>
                </div>
              </div>
              <div className="flex items-start space-x-2 pt-2 border-t border-neutral-900">
                <div className="w-2.5 h-2.5 bg-emerald-400 mt-1 shrink-0" />
                <div>
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block">Destination</span>
                  <span className="text-neutral-200">{ride?.dropoffAddress || 'Sector V, Bidhannagar'}</span>
                </div>
              </div>
            </div>

            {/* Cancel ride (disabled once trip is in progress) */}
            {onCancel && statusStep < 3 && !tripCompleted && (
              <button
                onClick={onCancel}
                className="w-full py-2.5 text-xs font-semibold text-neutral-400 hover:text-red-400 transition cursor-pointer"
              >
                Cancel ride
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Leaflet Map */}
        <div className="lg:col-span-7">
          <InteractiveMap
            pickupCoords={ride?.pickupCoords || [22.6113, 88.4202]}
            dropoffCoords={ride?.dropoffCoords || [22.5804, 88.4378]}
            height="560px"
            nearbyDrivers={[
              {
                id: 'active_driver',
                vehicle_model: `${ride?.driverName || 'Driver'} (${ride?.vehicleModel || 'Toyota'})`,
                latitude: driverCoords[0],
                longitude: driverCoords[1],
                rating: ride?.driverRating || 4.98
              }
            ]}
          />
        </div>
      </div>
    </div>
  );
}
