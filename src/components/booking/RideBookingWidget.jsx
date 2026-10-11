import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  ChevronDown,
  ArrowRight,
  Car,
  Users,
  CheckCircle2,
  AlertCircle,
  Tag
} from 'lucide-react';
import { CONFIG } from '../../constants/config';

export default function RideBookingWidget({
  onRouteCalculated,
  onPickupChange,
  onDropoffChange,
  onViewMapClick
}) {
  const [city, setCity] = useState(CONFIG.DEFAULT_CITY);
  const [pickup, setPickup] = useState('Market St, San Francisco, CA');
  const [pickupCoords, setPickupCoords] = useState({ lat: 37.7749, lng: -122.4194 });

  const [dropoff, setDropoff] = useState("Fisherman's Wharf, San Francisco, CA");
  const [dropoffCoords, setDropoffCoords] = useState({ lat: 37.8080, lng: -122.4177 });

  const [pickupTime, setPickupTime] = useState('Pickup now');
  const [showTimeModal, setShowTimeModal] = useState(false);

  const [promoCode, setPromoCode] = useState('WELCOME50');
  const [promoApplied, setPromoApplied] = useState(null);

  const [loading, setLoading] = useState(false);
  const [estimates, setEstimates] = useState(null);
  const [selectedTier, setSelectedTier] = useState('economy');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle calculating fares and drawing route
  const handleCalculateFare = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Fetch Fare Estimates from Backend
      const fareResponse = await fetch(`${CONFIG.BACKEND_URL}/fares/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLatitude: pickupCoords.lat,
          pickupLongitude: pickupCoords.lng,
          dropoffLatitude: dropoffCoords.lat,
          dropoffLongitude: dropoffCoords.lng,
          promoCode: promoCode || undefined
        })
      });

      const fareData = await fareResponse.json();

      if (fareData.success) {
        setEstimates(fareData.data);
        if (fareData.data.appliedPromo) {
          setPromoApplied(fareData.data.appliedPromo);
        }
      }

      // 2. Fetch Leaflet / OSRM Polyline Route from Backend
      const routeResponse = await fetch(`${CONFIG.BACKEND_URL}/fares/route`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLatitude: pickupCoords.lat,
          pickupLongitude: pickupCoords.lng,
          dropoffLatitude: dropoffCoords.lat,
          dropoffLongitude: dropoffCoords.lng
        })
      });

      const routeData = await routeResponse.json();
      if (routeData.success && onRouteCalculated) {
        onRouteCalculated({
          pickup: [pickupCoords.lat, pickupCoords.lng],
          dropoff: [dropoffCoords.lat, dropoffCoords.lng],
          coordinates: routeData.data.coordinates,
          distanceKm: routeData.data.distanceKm,
          durationMin: routeData.data.durationMin
        });
      }
    } catch (err) {
      setErrorMsg('Could not calculate fare. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking the ride
  const handleBookRide = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.BACKEND_URL}/rides/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer rider_official_user'
        },
        body: JSON.stringify({
          pickupAddress: pickup,
          pickupLatitude: pickupCoords.lat,
          pickupLongitude: pickupCoords.lng,
          dropoffAddress: dropoff,
          dropoffLatitude: dropoffCoords.lat,
          dropoffLongitude: dropoffCoords.lng,
          vehicleType: selectedTier,
          promoCode: promoCode || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        setBookingConfirmed(data.data);
      } else {
        setErrorMsg(data.message || 'Ride booking failed');
      }
    } catch (err) {
      setErrorMsg('Connection error. Could not book ride.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[500px] text-white">
      {/* 1. City selector row matching official Uber: 📍 San Francisco, CA  Change city */}
      <div className="flex items-center space-x-2 text-xs font-medium text-neutral-300 mb-4">
        <MapPin className="w-3.5 h-3.5 text-white" />
        <span className="text-white font-semibold">{city}</span>
        <button
          type="button"
          onClick={() => {
            const newCity = prompt('Enter city name:', city);
            if (newCity) setCity(newCity);
          }}
          className="underline text-neutral-400 hover:text-white transition cursor-pointer"
        >
          Change city
        </button>
      </div>

      {/* 2. Official Headline */}
      <h1 className="text-5xl sm:text-[56px] font-black tracking-[-0.03em] leading-[1.05] text-white mb-6">
        Go anywhere
      </h1>

      {bookingConfirmed ? (
        /* Booking Confirmed State */
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-5 animate-fadeIn">
          <div className="flex items-center space-x-3 text-emerald-400">
            <CheckCircle2 className="w-8 h-8 shrink-0" />
            <div>
              <h3 className="text-xl font-bold text-white">Ride Requested!</h3>
              <p className="text-xs text-neutral-400">Searching for nearest verified drivers...</p>
            </div>
          </div>

          <div className="bg-black border border-neutral-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">Your Ride PIN</span>
              <span className="text-2xl font-black text-amber-400 tracking-widest bg-amber-400/10 px-3 py-1 rounded-lg">
                {bookingConfirmed.otp}
              </span>
            </div>
            <div className="text-xs space-y-1.5 text-neutral-300">
              <div><strong>Pickup:</strong> {bookingConfirmed.pickup_address}</div>
              <div><strong>Dropoff:</strong> {bookingConfirmed.dropoff_address}</div>
              <div><strong>Final Fare:</strong> ${bookingConfirmed.final_fare || bookingConfirmed.estimated_fare}</div>
            </div>
          </div>

          <button
            onClick={() => setBookingConfirmed(null)}
            className="w-full py-3 bg-white text-black font-bold text-sm rounded-lg hover:bg-neutral-200 transition cursor-pointer"
          >
            Book Another Ride
          </button>
        </div>
      ) : (
        /* Official Uber Search Form */
        <form onSubmit={handleCalculateFare} className="space-y-4">
          {/* Pickup now pill button */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowTimeModal(!showTimeModal)}
              className="inline-flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-full font-semibold text-sm hover:bg-neutral-200 transition shadow-sm cursor-pointer"
            >
              <Clock className="w-4 h-4" />
              <span>{pickupTime}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </button>

            {showTimeModal && (
              <div className="absolute top-full left-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-xl p-2 z-50 text-xs shadow-2xl space-y-1">
                <button
                  type="button"
                  onClick={() => { setPickupTime('Pickup now'); setShowTimeModal(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-lg text-white font-medium cursor-pointer"
                >
                  Pickup now
                </button>
                <button
                  type="button"
                  onClick={() => { setPickupTime('Schedule for later'); setShowTimeModal(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-neutral-800 rounded-lg text-white font-medium cursor-pointer"
                >
                  Schedule for later
                </button>
              </div>
            )}
          </div>

          {/* Connected Inputs with official light-gray background & icon connectors */}
          <div className="relative space-y-2">
            {/* Vertical connector line */}
            <div className="absolute left-[20px] top-[26px] bottom-[26px] w-[2px] bg-neutral-400 z-10 pointer-events-none"></div>

            {/* Input 1: Pickup Location */}
            <div className="relative flex items-center bg-[#f3f3f3] rounded-lg border border-transparent focus-within:border-black transition">
              <div className="w-10 flex justify-center z-20">
                {/* Official circle icon */}
                <div className="w-3 h-3 rounded-full border-2 border-black flex items-center justify-center bg-transparent">
                  <div className="w-1 h-1 rounded-full bg-black"></div>
                </div>
              </div>
              <input
                type="text"
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Pickup location"
                required
                className="w-full bg-transparent text-black text-[15px] font-medium py-3.5 pr-10 focus:outline-none placeholder-neutral-500"
              />
              <button
                type="button"
                title="Current location"
                onClick={() => {
                  setPickup('Market St, San Francisco, CA');
                  setPickupCoords({ lat: 37.7749, lng: -122.4194 });
                }}
                className="absolute right-3 text-black hover:opacity-70 transition p-1 cursor-pointer"
              >
                <Navigation className="w-4 h-4 fill-black" />
              </button>
            </div>

            {/* Input 2: Dropoff Location */}
            <div className="relative flex items-center bg-[#f3f3f3] rounded-lg border border-transparent focus-within:border-black transition">
              <div className="w-10 flex justify-center z-20">
                {/* Official solid square icon */}
                <div className="w-2.5 h-2.5 bg-black"></div>
              </div>
              <input
                type="text"
                value={dropoff}
                onChange={(e) => setDropoff(e.target.value)}
                placeholder="Dropoff location"
                required
                className="w-full bg-transparent text-black text-[15px] font-medium py-3.5 pr-4 focus:outline-none placeholder-neutral-500"
              />
            </div>
          </div>

          {/* Promo code mini bar */}
          <div className="flex items-center space-x-2 bg-neutral-900 px-3 py-2 rounded-lg border border-neutral-800 text-xs">
            <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-neutral-400">Coupon:</span>
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="e.g. WELCOME50"
              className="bg-transparent text-white font-bold tracking-wider uppercase focus:outline-none text-xs w-full"
            />
          </div>

          {/* Error message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Vehicle options (displayed once calculated) */}
          {estimates && (
            <div className="space-y-2 pt-2 animate-fadeIn">
              <div className="flex justify-between items-center text-xs text-neutral-400 px-1">
                <span>{estimates.distanceKm} km · {estimates.durationMin} min</span>
                {promoApplied && (
                  <span className="text-emerald-400 font-semibold">Promo Applied ({promoApplied.code})</span>
                )}
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {estimates.estimates.map((tier) => (
                  <div
                    key={tier.vehicleTypeId}
                    onClick={() => setSelectedTier(tier.vehicleTypeId)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                      selectedTier === tier.vehicleTypeId
                        ? 'bg-neutral-900 border-white'
                        : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center">
                        <Car className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{tier.name}</span>
                          <span className="flex items-center text-xs text-neutral-400">
                            <Users className="w-3 h-3 mr-0.5" />
                            {tier.capacity}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">{tier.durationMin} min away</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-base text-white">${tier.finalFare}</span>
                      {tier.discountAmount > 0 && (
                        <span className="block text-xs line-through text-neutral-500">
                          ${tier.subtotal}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions: See prices & Log in to check your activity */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {!estimates ? (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-neutral-200 transition active:scale-[0.98] disabled:opacity-50 shadow-md cursor-pointer"
              >
                {loading ? 'Calculating...' : 'See prices'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleBookRide}
                disabled={loading}
                className="px-6 py-3.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-neutral-200 transition active:scale-[0.98] disabled:opacity-50 shadow-md cursor-pointer"
              >
                {loading ? 'Confirming...' : `Request ${selectedTier.toUpperCase()}`}
              </button>
            )}

            <a
              href="#login"
              className="text-sm font-semibold text-white underline underline-offset-4 hover:text-neutral-300 transition"
            >
              Log in to check your activity
            </a>
          </div>
        </form>
      )}
    </div>
  );
}
