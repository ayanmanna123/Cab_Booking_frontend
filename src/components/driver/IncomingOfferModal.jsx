import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, DollarSign, Clock, Check, X } from 'lucide-react';

export default function IncomingOfferModal({ offer, onAccept, onDecline }) {
  const [timeLeft, setTimeLeft] = useState(15);

  useEffect(() => {
    if (!offer) return;
    setTimeLeft(15);

    const timer = setInterval(() => {
      setTimeLeft(prev => {
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

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl space-y-6 p-6">
        {/* Countdown header */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Incoming Ride Request
          </span>
          <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-300">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>{timeLeft}s</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Payout & Vehicle Info */}
        <div className="flex items-center justify-between bg-black p-4 rounded-2xl border border-neutral-800">
          <div>
            <span className="text-xs text-neutral-400 block font-medium">Estimated Earnings</span>
            <span className="text-3xl font-black text-white">${offer.estimatedFare || '24.50'}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-400 block font-medium">Tier</span>
            <span className="text-sm font-bold text-neutral-200">{offer.vehicleTier || 'UberX'}</span>
          </div>
        </div>

        {/* Pickup & Destination */}
        <div className="space-y-3 bg-neutral-950 p-4 rounded-2xl border border-neutral-800 text-xs">
          <div className="flex items-start space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Pickup</span>
              <span className="font-semibold text-white">{offer.pickupAddress || 'Market St, San Francisco, CA'}</span>
            </div>
          </div>
          <div className="flex items-start space-x-3 pt-2 border-t border-neutral-800">
            <div className="w-2.5 h-2.5 rounded bg-amber-400 mt-1 shrink-0" />
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Dropoff</span>
              <span className="font-semibold text-white">{offer.dropoffAddress || "Fisherman's Wharf, San Francisco, CA"}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onDecline(offer)}
            className="py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-sm rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Decline</span>
          </button>
          <button
            onClick={() => onAccept(offer)}
            className="py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Accept Ride</span>
          </button>
        </div>
      </div>
    </div>
  );
}
