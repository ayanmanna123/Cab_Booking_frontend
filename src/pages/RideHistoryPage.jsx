import React, { useState, useEffect, useCallback } from 'react';
import { Clock, RefreshCw, Car, CheckCircle, Navigation, Shield, ArrowLeft } from 'lucide-react';
import { ridesApi } from '../api';
import RideHistoryTable from '../components/history/RideHistoryTable';
import RideReceiptModal from '../components/history/RideReceiptModal';

const RUNNING_STATUSES = ['REQUESTED', 'SEARCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS'];

export default function RideHistoryPage({ onTrackRide, onBackToHome }) {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'running' | 'completed' | 'cancelled'
  const [selectedReceiptRide, setSelectedReceiptRide] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch from backend API (which accesses cb_ride_history or cb_rides)
      const res = await ridesApi.getRideHistory(1, 50);
      let fetchedList = [];

      if (res && res.success && res.data) {
        fetchedList = Array.isArray(res.data) ? res.data : (res.data.rides || []);
      }

      // 2. Also merge active ride from localStorage if currently running
      let activeLocalRide = null;
      try {
        const rawActive = localStorage.getItem('driver_active_ride') || localStorage.getItem('active_tracking_ride');
        if (rawActive) {
          activeLocalRide = JSON.parse(rawActive);
        }
      } catch {}

      if (activeLocalRide && activeLocalRide.id) {
        const existingIdx = fetchedList.findIndex((r) => String(r.id || r.ride_id) === String(activeLocalRide.id));
        if (existingIdx >= 0) {
          fetchedList[existingIdx] = { ...fetchedList[existingIdx], ...activeLocalRide };
        } else {
          fetchedList.unshift(activeLocalRide);
        }
      }

      setRides(fetchedList);
    } catch (err) {
      console.warn('Ride history fetch note:', err.message);
      // Fallback to local cache if offline
      try {
        const rawActive = localStorage.getItem('driver_active_ride') || localStorage.getItem('active_tracking_ride');
        if (rawActive) {
          const parsed = JSON.parse(rawActive);
          setRides([parsed]);
        }
      } catch {}
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleTrackRideAction = (ride) => {
    try {
      localStorage.setItem('driver_active_ride', JSON.stringify(ride));
      localStorage.setItem('active_tracking_ride', JSON.stringify(ride));
    } catch {}

    if (onTrackRide) {
      onTrackRide(ride);
    } else {
      window.history.pushState({ ride }, '', '/tracking');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  // Compute filter subsets
  const runningRides = rides.filter((r) => RUNNING_STATUSES.includes((r.status || '').toUpperCase()));
  const completedRides = rides.filter((r) => (r.status || '').toUpperCase() === 'COMPLETED');
  const cancelledRides = rides.filter((r) => (r.status || '').toUpperCase() === 'CANCELLED');

  const displayedRides = rides.filter((r) => {
    const s = (r.status || '').toUpperCase();
    if (activeFilter === 'running') return RUNNING_STATUSES.includes(s);
    if (activeFilter === 'completed') return s === 'COMPLETED';
    if (activeFilter === 'cancelled') return s === 'CANCELLED';
    return true;
  });

  // Calculate statistics
  const totalSpent = completedRides.reduce((sum, r) => {
    return sum + Number(r.final_fare || r.finalFare || r.estimated_fare || r.fare || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-black text-white pt-6 pb-16 px-4 sm:px-8 max-w-[1280px] mx-auto">
      {/* Top Breadcrumb & Refresh */}
      <div className="flex items-center justify-between pb-6 border-b border-neutral-900">
        <button
          onClick={onBackToHome || (() => { window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); })}
          className="flex items-center space-x-2 text-xs font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Ride Booking</span>
        </button>

        <button
          onClick={fetchHistory}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Activity</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-bold rounded bg-neutral-900 border border-neutral-800 text-neutral-300 uppercase tracking-wider mb-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Trip Records</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Activity & Ride History
            </h1>
            <p className="text-sm text-neutral-400 mt-1 max-w-xl">
              Track live trips in real time, inspect completed rides, and review downloadable fare receipts.
            </p>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8">
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-900">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Rides</div>
            <div className="text-2xl font-black text-white mt-1">{rides.length}</div>
            <div className="text-[11px] text-neutral-400 mt-1">All recorded bookings</div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-900">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Running Rides</div>
            <div className="text-2xl font-black text-white mt-1">{runningRides.length}</div>
            <div className="text-[11px] text-neutral-400 mt-1">
              {runningRides.length > 0 ? 'Live tracking available' : 'No active trips'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-900">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Completed</div>
            <div className="text-2xl font-black text-white mt-1">{completedRides.length}</div>
            <div className="text-[11px] text-neutral-400 mt-1">Finished with receipts</div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-900">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Total Spent</div>
            <div className="text-2xl font-black text-white mt-1 font-mono">₹{totalSpent.toFixed(2)}</div>
            <div className="text-[11px] text-neutral-400 mt-1">Completed fare volume</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-neutral-900 pb-3 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 ${
            activeFilter === 'all'
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          All Trips ({rides.length})
        </button>

        <button
          onClick={() => setActiveFilter('running')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 flex items-center space-x-1.5 ${
            activeFilter === 'running'
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Running Rides ({runningRides.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('completed')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 ${
            activeFilter === 'completed'
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Completed ({completedRides.length})
        </button>

        <button
          onClick={() => setActiveFilter('cancelled')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition cursor-pointer shrink-0 ${
            activeFilter === 'cancelled'
              ? 'bg-white text-black'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          Cancelled ({cancelledRides.length})
        </button>
      </div>

      {/* Content Section */}
      {loading && rides.length === 0 ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 text-neutral-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-neutral-400 font-medium">Loading ride history from Supabase...</p>
        </div>
      ) : (
        <RideHistoryTable
          rides={displayedRides}
          onTrackRide={handleTrackRideAction}
          onSelectRide={(ride) => setSelectedReceiptRide(ride)}
        />
      )}

      {/* Receipt Modal */}
      {selectedReceiptRide && (
        <RideReceiptModal
          ride={selectedReceiptRide}
          onClose={() => setSelectedReceiptRide(null)}
        />
      )}
    </div>
  );
}
