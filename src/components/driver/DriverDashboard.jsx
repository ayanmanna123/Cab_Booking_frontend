import React, { useState, useEffect } from 'react';
import {
  Power,
  DollarSign,
  TrendingUp,
  MapPin,
  Navigation,
  ShieldCheck,
  Clock,
  Car
} from 'lucide-react';
import InteractiveMap from '../map/InteractiveMap';
import IncomingOfferModal from './IncomingOfferModal';
import { useSocketContext } from '../../context/SocketContext';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { driversApi } from '../../api';

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [driverLocation, setDriverLocation] = useState([37.7749, -122.4194]);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [todayEarnings, setTodayEarnings] = useState(148.50);
  const [completedTrips, setCompletedTrips] = useState(5);
  const [activeRide, setActiveRide] = useState(null);

  const { socket, joinDriverRoom } = useSocketContext();

  // Listen for socket ride offers
  useEffect(() => {
    if (!socket) return;

    joinDriverRoom('demo_driver_1');

    socket.on(SOCKET_EVENTS.RIDE_NEW_OFFER, (data) => {
      console.log('🔔 [Driver] New offer received via WebSocket:', data);
      setIncomingOffer(data);
    });

    return () => {
      socket.off(SOCKET_EVENTS.RIDE_NEW_OFFER);
    };
  }, [socket, joinDriverRoom]);

  const handleToggleOnline = async () => {
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);

    try {
      await driversApi.toggleStatus('demo_driver_1', nextStatus);
    } catch (e) {
      // Fallback
    }

    if (nextStatus) {
      // Simulate incoming offer after 6 seconds if none exists
      const demoTimer = setTimeout(() => {
        if (!incomingOffer && !activeRide) {
          setIncomingOffer({
            id: 'ride_sim_' + Math.floor(Math.random() * 1000),
            pickupAddress: 'Financial District, San Francisco, CA',
            dropoffAddress: 'Mission Bay, San Francisco, CA',
            estimatedFare: '28.75',
            vehicleTier: 'UberX',
            pickupCoords: [37.7946, -122.3999],
            dropoffCoords: [37.7709, -122.3912]
          });
        }
      }, 5000);
      return () => clearTimeout(demoTimer);
    }
  };

  const handleAcceptOffer = (offer) => {
    setActiveRide(offer);
    setIncomingOffer(null);
    setTodayEarnings(prev => prev + Number(offer.estimatedFare || 25));
    setCompletedTrips(prev => prev + 1);
  };

  const handleDeclineOffer = () => {
    setIncomingOffer(null);
  };

  const handleCompleteRide = () => {
    setActiveRide(null);
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 select-none">
      {/* Top Header & Online Toggle */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-neutral-900 border border-neutral-800 p-6 rounded-3xl gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-neutral-600'}`} />
            <h1 className="text-2xl font-black text-white">Driver Portal</h1>
            <span className="text-xs bg-neutral-800 px-2.5 py-0.5 rounded-full text-neutral-300 font-semibold">
              Toyota Camry (UberX)
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            {isOnline
              ? 'You are online and eligible for dispatch requests across the city.'
              : 'You are currently offline. Go online to start receiving ride offers.'}
          </p>
        </div>

        <button
          onClick={handleToggleOnline}
          className={`flex items-center space-x-2.5 px-6 py-3.5 rounded-2xl font-black text-sm transition cursor-pointer shadow-lg active:scale-95 ${
            isOnline
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black'
          }`}
        >
          <Power className="w-4 h-4" />
          <span>{isOnline ? 'Go Offline' : 'Go Online'}</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Today's Net Payout</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">${todayEarnings.toFixed(2)}</div>
          <span className="text-[11px] text-emerald-400 font-medium">+18% vs yesterday</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Completed Trips</span>
            <Car className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black text-white">{completedTrips}</div>
          <span className="text-[11px] text-neutral-400">100% acceptance rating today</span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Driver Score</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black text-white">4.98 ⭐</div>
          <span className="text-[11px] text-neutral-400">Top-rated Premier status</span>
        </div>
      </div>

      {/* Active Trip Banner if riding */}
      {activeRide && (
        <div className="bg-emerald-950/70 border border-emerald-700/80 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full">
              Trip In Progress
            </span>
            <button
              onClick={handleCompleteRide}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition cursor-pointer"
            >
              Complete Trip
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-200">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Pickup</span>
              <span className="font-semibold">{activeRide.pickupAddress}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Destination</span>
              <span className="font-semibold">{activeRide.dropoffAddress}</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaflet GPS Radar Map */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-white">Live Road Heatmap & Navigation</span>
          <span className="text-xs text-neutral-400">OpenStreetMap GPS Live</span>
        </div>
        <InteractiveMap
          pickupCoords={driverLocation}
          height="480px"
          nearbyDrivers={[
            { id: 'me', vehicle_model: 'You (Driver)', latitude: driverLocation[0], longitude: driverLocation[1], rating: 4.98 }
          ]}
        />
      </div>

      {/* Incoming Offer Modal */}
      {incomingOffer && (
        <IncomingOfferModal
          offer={incomingOffer}
          onAccept={handleAcceptOffer}
          onDecline={handleDeclineOffer}
        />
      )}
    </div>
  );
}
