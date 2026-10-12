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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div className="bg-neutral-900 border-2 border-emerald-500/60 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl space-y-5 p-6 animate-in zoom-in-95">
        {/* Countdown header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black tracking-wider uppercase text-emerald-400">
              New Ride Request
            </h3>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{timeLeft}s remaining</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Payout & Vehicle Info */}
        <div className="flex items-center justify-between bg-black p-4 rounded-2xl border border-neutral-800">
          <div>
            <span className="text-[11px] text-neutral-400 block uppercase font-bold tracking-wider">
              Driver Earnings
            </span>
            <span className="text-3xl font-black text-emerald-400">₹{earnings}</span>
            <span className="text-[10px] text-neutral-500 block">Total fare: ₹{offer.estimatedFare || earnings}</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-neutral-400 block uppercase font-bold tracking-wider">
              Category
            </span>
            <span className="text-sm font-bold text-white block mt-0.5">
              {offer.vehicleTier || offer.vehicleType || 'Uber Go AC'}
            </span>
          </div>
        </div>

        {/* Rider Profile row */}
        <div className="flex items-center justify-between bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-xs">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4 text-neutral-300" />
            </div>
            <div>
              <span className="font-bold text-white block">{offer.riderName || 'Uber Rider'}</span>
              <span className="text-[11px] text-neutral-400 flex items-center">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 mr-1" />
                {offer.riderRating || '5.0'} rating
              </span>
            </div>
          </div>
          <div className="text-right text-[11px] text-neutral-400">
            <span className="text-emerald-400 font-bold block">{offer.distanceToPickup || '1.2 km'} away</span>
            <span>~4 mins to pickup</span>
          </div>
        </div>

        {/* Pickup & Destination */}
        <div className="space-y-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs">
          <div>
            <span className="text-neutral-500 block text-[10px] uppercase font-bold">Pickup Location</span>
            <span className="font-semibold text-white block truncate">{offer.pickupAddress || 'Pickup Point'}</span>
          </div>
          <div className="pt-2 border-t border-neutral-900">
            <span className="text-neutral-500 block text-[10px] uppercase font-bold">Destination</span>
            <span className="font-semibold text-white block truncate">{offer.dropoffAddress || 'Destination Point'}</span>
          </div>
        </div>

        {/* Trip distance & duration stats */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">Est. Distance</span>
            <span className="font-bold text-white">{offer.distanceKm ? `${offer.distanceKm} km` : '4.8 km'}</span>
          </div>
          <div className="bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
            <span className="text-[10px] text-neutral-500 uppercase font-bold block">Est. Duration</span>
            <span className="font-bold text-white">{offer.durationMin ? `${offer.durationMin} mins` : '15 mins'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => onDecline(offer)}
            className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer active:scale-95 border border-neutral-700"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>
          <button
            type="button"
            onClick={() => onAccept(offer)}
            className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-xl shadow-emerald-500/30 active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Accept Ride</span>
          </button>
        </div>
      </div>
    </div>
  );
}
