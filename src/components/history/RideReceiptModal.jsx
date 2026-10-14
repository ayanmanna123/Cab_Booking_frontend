import React from 'react';
import { X, CheckCircle, Car, MapPin, Calendar, Clock, CreditCard, ShieldCheck, Printer, Download } from 'lucide-react';

export default function RideReceiptModal({ ride, onClose }) {
  if (!ride) return null;

  const fareNumber = Number(ride.final_fare || ride.finalFare || ride.estimated_fare || ride.fare || 0).toFixed(2);
  const distanceKm = Number(ride.distance_km || ride.distanceKm || 0).toFixed(1);
  const durationMin = Math.round(Number(ride.duration_min || ride.durationMin || 0));
  const rideDate = ride.created_at || ride.createdAt ? new Date(ride.created_at || ride.createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'Recent Trip';

  const isCompleted = (ride.status || '').toUpperCase() === 'COMPLETED';
  const isCancelled = (ride.status || '').toUpperCase() === 'CANCELLED';

  const driverName = ride.driver_name || ride.driver?.driver_user?.full_name || ride.driverName || 'Verified Driver';
  const driverPlate = ride.vehicle_plate || ride.driver?.license_plate || ride.licensePlate || 'WB 02 AB 4488';
  const vehicleName = ride.vehicle_name || ride.cb_vehicle_types?.name || ride.vehicleModel || 'Veyro Go';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-neutral-800 bg-neutral-950">
          <div className="flex items-center space-x-2.5">
            <img
              src="/Logo 4.avif"
              alt="Veyro"
              className="w-6 h-6 object-contain rounded-md"
            />
            <span className="text-xl font-black tracking-tight text-white">Veyro</span>
            <span className="text-xs px-2.5 py-1 font-semibold rounded bg-neutral-800 text-neutral-300 border border-neutral-700">
              Trip Receipt
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close receipt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 text-neutral-200">
          {/* Status & Total */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-black border border-neutral-800">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Billed</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">₹{fareNumber}</div>
              <div className="text-xs text-neutral-400 mt-1 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[170px] sm:max-w-none">{rideDate}</span>
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-block px-3 py-1 text-xs font-bold rounded uppercase tracking-wider ${
                  isCompleted
                    ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                    : isCancelled
                    ? 'bg-neutral-900 text-neutral-400 border border-neutral-800'
                    : 'bg-white text-black font-semibold'
                }`}
              >
                {ride.status || 'TRIP'}
              </span>
              <div className="text-xs text-neutral-400 mt-2 font-mono">
                ID: {String(ride.ride_id || ride.id || '').slice(0, 8)}
              </div>
            </div>
          </div>

          {/* Route Section */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-black border border-neutral-800 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Trip Itinerary</div>
            
            <div className="space-y-3.5 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded bg-white"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-neutral-400">Pickup Location</div>
                  <div className="font-semibold text-white mt-0.5 text-xs sm:text-sm break-words">
                    {ride.pickup_address || ride.pickupAddress || 'Pickup Point'}
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-neutral-400">Dropoff Location</div>
                  <div className="font-semibold text-white mt-0.5 text-xs sm:text-sm break-words">
                    {ride.dropoff_address || ride.dropoffAddress || 'Dropoff Destination'}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-400">
              <span className="flex items-center space-x-1.5">
                <Car className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                <span>Distance: <strong className="text-neutral-200">{distanceKm} km</strong></span>
              </span>
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                <span>Duration: <strong className="text-neutral-200">{durationMin} min</strong></span>
              </span>
            </div>
          </div>

          {/* Driver & Vehicle */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-black border border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0">
                {ride.driver_avatar ? (
                  <img src={ride.driver_avatar} alt={driverName} className="w-full h-full object-cover" />
                ) : (
                  <span>{driverName.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-bold text-white flex items-center space-x-1.5 truncate">
                  <span className="truncate">{driverName}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                </div>
                <div className="text-[11px] sm:text-xs text-neutral-400 mt-0.5 truncate">
                  {vehicleName} • <span className="font-mono text-neutral-300">{driverPlate}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] sm:text-xs text-neutral-400">Rating</div>
              <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                ★ {Number(ride.driver_rating || 4.9).toFixed(1)}
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-black border border-neutral-800 space-y-2.5 text-xs">
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 pb-1 border-b border-neutral-800">
              Payment Breakdown
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Base Fare</span>
              <span className="text-neutral-200 font-mono">₹{Number(ride.base_fare || 40).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Distance & Time Rate</span>
              <span className="text-neutral-200 font-mono">
                ₹{Number((fareNumber - Number(ride.base_fare || 40)) > 0 ? (fareNumber - Number(ride.base_fare || 40)) : 0).toFixed(2)}
              </span>
            </div>
            {Number(ride.discount_amount || 0) > 0 && (
              <div className="flex justify-between text-neutral-300">
                <span>Promotion Discount</span>
                <span className="font-mono">-₹{Number(ride.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-neutral-800 flex justify-between text-sm font-bold text-white">
              <span>Amount Charged</span>
              <span className="font-mono">₹{fareNumber}</span>
            </div>
            <div className="pt-1 flex flex-wrap items-center justify-between gap-1 text-neutral-400 text-[11px]">
              <span className="flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>Method: {String(ride.payment_method || 'Cash / Digital').toUpperCase()}</span>
              </span>
              <span>Status: {String(ride.payment_status || 'SUCCEEDED').toUpperCase()}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition flex items-center space-x-1.5 sm:space-x-2 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 shrink-0" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 sm:px-5 py-2 text-xs font-bold rounded-lg bg-white text-black hover:bg-neutral-200 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
