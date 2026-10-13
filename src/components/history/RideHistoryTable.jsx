import React, { useState } from 'react';
import { Navigation, FileText, Search, MapPin, Calendar, Clock, Car, ChevronRight } from 'lucide-react';

const RUNNING_STATUSES = ['REQUESTED', 'SEARCHING', 'ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS'];

export default function RideHistoryTable({ rides = [], onTrackRide, onSelectRide }) {
  const [searchQuery, setSearchQuery] = useState('');

  const isRunning = (status) => RUNNING_STATUSES.includes((status || '').toUpperCase());

  const filteredRides = rides.filter((ride) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const pickup = (ride.pickup_address || ride.pickupAddress || '').toLowerCase();
    const dropoff = (ride.dropoff_address || ride.dropoffAddress || '').toLowerCase();
    const vehicle = (ride.vehicle_name || ride.vehicleModel || '').toLowerCase();
    const driver = (ride.driver_name || ride.driverName || '').toLowerCase();
    return pickup.includes(query) || dropoff.includes(query) || vehicle.includes(query) || driver.includes(query);
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (isRunning(s)) {
      return (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded bg-neutral-800 text-white border border-neutral-700 uppercase tracking-wider">
          Live Trip
        </span>
      );
    }
    if (s === 'COMPLETED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-neutral-900 text-neutral-300 border border-neutral-800 uppercase tracking-wider">
          Completed
        </span>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-neutral-900 text-neutral-500 border border-neutral-800 uppercase tracking-wider">
          Cancelled
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded bg-neutral-900 text-neutral-400 border border-neutral-800 uppercase tracking-wider">
        {s || 'PENDING'}
      </span>
    );
  };

  if (!rides || rides.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-neutral-950 border border-neutral-900 text-neutral-400">
        <Car className="w-12 h-12 mx-auto text-neutral-600 mb-3" />
        <h3 className="text-base font-bold text-white mb-1">No trips found</h3>
        <p className="text-xs text-neutral-500 max-w-sm mx-auto">
          You haven't taken any rides yet. Book a ride on the homepage to start tracking your trips here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rides by pickup, dropoff destination, or driver..."
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition"
        />
      </div>

      {/* Desktop & Tablet Table View with deliberate horizontal scrolling container */}
      <div className="hidden md:block rounded-xl border border-neutral-800 bg-neutral-950 overflow-x-auto shadow-lg">
        <table className="w-full min-w-[700px] text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-900/60 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              <th className="py-3.5 px-5">Date & Time</th>
              <th className="py-3.5 px-5">Route Itinerary</th>
              <th className="py-3.5 px-5">Vehicle & Driver</th>
              <th className="py-3.5 px-4">Fare</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-900 text-xs">
            {filteredRides.map((ride) => {
              const rideRunning = isRunning(ride.status);
              const rideDate = ride.created_at || ride.createdAt
                ? new Date(ride.created_at || ride.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Recent Trip';

              const fare = Number(ride.final_fare || ride.finalFare || ride.estimated_fare || ride.fare || 0).toFixed(2);
              const driverName = ride.driver_name || ride.driver?.driver_user?.full_name || ride.driverName || 'Assigned Driver';
              const vehicleName = ride.vehicle_name || ride.cb_vehicle_types?.name || ride.vehicleModel || 'Uber Go';

              return (
                <tr
                  key={ride.id || ride.ride_id || Math.random()}
                  className={`hover:bg-neutral-900/40 transition-colors ${
                    rideRunning ? 'bg-neutral-900/20' : ''
                  }`}
                >
                  {/* Date */}
                  <td className="py-4 px-5 text-neutral-300 font-medium whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{rideDate}</span>
                    </div>
                  </td>

                  {/* Route */}
                  <td className="py-4 px-5 max-w-[260px]">
                    <div className="space-y-1">
                      <div className="truncate text-white font-medium flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></div>
                        <span className="truncate">{ride.pickup_address || ride.pickupAddress || 'Pickup'}</span>
                      </div>
                      <div className="truncate text-neutral-400 flex items-center space-x-1.5">
                        <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span className="truncate">{ride.dropoff_address || ride.dropoffAddress || 'Destination'}</span>
                      </div>
                    </div>
                  </td>

                  {/* Vehicle & Driver */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="text-white font-medium">{vehicleName}</div>
                    <div className="text-neutral-400 text-[11px] mt-0.5">{driverName}</div>
                  </td>

                  {/* Fare */}
                  <td className="py-4 px-4 whitespace-nowrap font-mono font-bold text-white">
                    ₹{fare}
                  </td>

                  {/* Status */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    {getStatusBadge(ride.status)}
                  </td>

                  {/* Action */}
                  <td className="py-4 px-5 text-right whitespace-nowrap">
                    {rideRunning ? (
                      <button
                        onClick={() => onTrackRide(ride)}
                        className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-white text-black hover:bg-neutral-200 transition flex items-center space-x-1.5 ml-auto cursor-pointer shadow-sm active:scale-95"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>Track Live Trip</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectRide(ride)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition flex items-center space-x-1.5 ml-auto cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Receipt</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredRides.map((ride) => {
          const rideRunning = isRunning(ride.status);
          const rideDate = ride.created_at || ride.createdAt
            ? new Date(ride.created_at || ride.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })
            : 'Recent Trip';

          const fare = Number(ride.final_fare || ride.finalFare || ride.estimated_fare || ride.fare || 0).toFixed(2);
          const vehicleName = ride.vehicle_name || ride.cb_vehicle_types?.name || ride.vehicleModel || 'Uber Go';
          const driverName = ride.driver_name || ride.driver?.driver_user?.full_name || ride.driverName || 'Verified Driver';

          return (
            <div
              key={ride.id || ride.ride_id || Math.random()}
              className={`p-4 rounded-xl border border-neutral-800 bg-neutral-950 space-y-3 ${
                rideRunning ? 'border-neutral-700 bg-neutral-900/30' : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">{rideDate}</span>
                {getStatusBadge(ride.status)}
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="text-white font-medium truncate flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></div>
                  <span className="truncate">{ride.pickup_address || ride.pickupAddress}</span>
                </div>
                <div className="text-neutral-400 truncate flex items-center space-x-1.5">
                  <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                  <span className="truncate">{ride.dropoff_address || ride.dropoffAddress}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white truncate">{vehicleName} · <span className="text-neutral-400 font-normal">{driverName}</span></div>
                  <div className="font-mono text-sm font-bold text-white mt-0.5">₹{fare}</div>
                </div>

                {rideRunning ? (
                  <button
                    onClick={() => onTrackRide(ride)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-white text-black hover:bg-neutral-200 transition flex items-center space-x-1.5 cursor-pointer shadow-sm active:scale-95 shrink-0"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Track Live</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectRide(ride)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition flex items-center space-x-1 cursor-pointer shrink-0"
                  >
                    <span>Receipt</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div> 
    </div>
  );
}
