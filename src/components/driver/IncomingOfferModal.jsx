import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, DollarSign, Clock, Check, X, User, Star } from 'lucide-react';

export default function IncomingOfferModal({ offer, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!offer) return;
    setTimeLeft(15);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(offer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [offer, onDecline]);

  if (!offer) return null;

  const progressPercent = (timeLeft / 15) * 100;
  const earnings = offer.driverEarnings || (offer.estimatedFare ? Math.round(Number(offer.estimatedFare) * 0.8 * 100) / 100 : '185.00');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn select-none">
      <div className="bg-neutral-950 border border-neutral-800 w-full max-w-sm max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-4 sm:p-5 space-y-3.5 animate-in zoom-in-95 text-white">
        {/* Countdown header */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-neutral-400">
            New Ride Request
          </span>
          <div className="flex items-center space-x-1.5 text-xs font-mono font-medium text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
            <Clock className="w-3 h-3 text-neutral-400" />
            <span>{timeLeft}s left</span>
          </div>
        </div>

        {/* Slim Progress Bar */}
        <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
          <div
            className="h-full bg-white transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Payout & Vehicle Info */}
        <div className="flex items-center justify-between bg-neutral-900/60 border border-neutral-800/80 p-3 rounded-xl">
          <div>
            <span className="text-[10px] text-neutral-400 block uppercase font-semibold tracking-wider">
              Driver Earnings
            </span>
            <span className="text-2xl font-bold tracking-tight text-white block">
              ₹{earnings}
            </span>
            <span className="text-[10px] text-neutral-500 block mt-0.5">
              Total fare: ₹{offer.estimatedFare || earnings}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-neutral-400 block uppercase font-semibold tracking-wider">
              Category
            </span>
            <span className="text-xs font-semibold text-white bg-black border border-neutral-800 px-2 py-1 rounded-md inline-block mt-1">
              {offer.vehicleTier || offer.vehicleType || 'Uber Go AC'}
            </span>
          </div>
        </div>

        {/* Rider Profile row */}
        <div className="flex items-center justify-between p-2.5 bg-neutral-900/40 border border-neutral-800/60 rounded-xl text-xs">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 text-white flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-neutral-300" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-white block truncate text-xs">
                {offer.riderName || 'Uber Rider'}
              </span>
              <div className="flex items-center space-x-1 text-[11px] text-neutral-400 mt-0.5">
                <Star className="w-3 h-3 text-white fill-white inline" />
                <span>{offer.riderRating || '5.0'} rating</span>
              </div>
            </div>
          </div>
          <div className="text-right text-[11px] shrink-0 pl-2">
            <span className="text-white font-medium block">{offer.distanceToPickup || '1.2 km'} away</span>
            <span className="text-neutral-500 block">~4 mins to pickup</span>
          </div>
        </div>

        {/* Pickup & Destination */}
        <div className="space-y-2 p-3 bg-neutral-900/40 border border-neutral-800/60 rounded-xl text-xs">
          <div className="flex items-start space-x-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-white mt-1 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Pickup Location</span>
              <span className="text-xs text-neutral-200 font-medium truncate block">{offer.pickupAddress || 'Pickup Point'}</span>
            </div>
          </div>
          <div className="border-t border-neutral-900 pt-1.5 flex items-start space-x-2 min-w-0">
            <MapPin className="w-3 h-3 text-neutral-400 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Destination</span>
              <span className="text-xs text-neutral-400 truncate block">{offer.dropoffAddress || 'Destination Point'}</span>
            </div>
          </div>
        </div>

        {/* Trip distance & duration stats */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-neutral-900/40 p-2 rounded-lg border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Est. Distance</span>
            <span className="font-semibold text-white text-xs">{offer.distanceKm ? `${offer.distanceKm} km` : '4.8 km'}</span>
          </div>
          <div className="bg-neutral-900/40 p-2 rounded-lg border border-neutral-800/60">
            <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Est. Duration</span>
            <span className="font-semibold text-white text-xs">{offer.durationMin ? `${offer.durationMin} mins` : '15 mins'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onDecline(offer)}
            className="h-10 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-95 border border-neutral-800"
          >
            <X className="w-3.5 h-3.5" />
            <span>Decline</span>
          </button>
          <button
            type="button"
            onClick={() => onAccept(offer)}
            className="h-10 px-3 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept Ride</span>
          </button>
        </div>
      </div>
    </div>
  );
}
