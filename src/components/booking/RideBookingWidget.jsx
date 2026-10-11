import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Clock,
  ChevronDown,
  ArrowRight,
  Car,
  Users,
  User,
  CheckCircle2,
  AlertCircle,
  Tag,
  Search,
  X,
  Loader2,
  Building2,
  Plane,
  Train
} from 'lucide-react';
import { CONFIG } from '../../constants/config';
import { ridesApi } from '../../api';

// Official transparent 3D car render assets from Uber CDN (white car icons)
export const OFFICIAL_UBER_CAR_IMAGES = {
  // 1. Uber Go AC
  uber_go_ac: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/HatchbackMini-Snowflake-520.png',
  uber_go: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/HatchbackMini-Snowflake-520.png',
  uberx: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/HatchbackMini-Snowflake-520.png',
  economy: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/HatchbackMini-Snowflake-520.png',

  // 2. Bike
  bike: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/MotorcycleOrange-249-0.png',
  moto: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/MotorcycleOrange-249-0.png',

  // 3. Go Non AC
  go_non_ac: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/HatchbackMini-433-0.png',

  // 4. UberXL
  uber_xl: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/MinivanLuggage-169-0.png',
  uberxl: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/MinivanLuggage-169-0.png',
  xl: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/MinivanLuggage-169-0.png',

  // 5. Go Priority
  go_priority: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/HatchbackMini-Lightning-435-0.png',

  // 6. Premier AC
  premier_ac: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/SedanComfort-Sparkles-523.png',
  premier: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/SedanComfort-Sparkles-523.png',
  comfort: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/SedanComfort-Sparkles-523.png',
  uber_comfort: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/SedanComfort-Sparkles-523.png',

  // 7. Parcel Bike
  parcel_bike: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/MotorcycleCourier-037-0.png',

  // 8. Parcel Scooter
  parcel_scooter: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/VespaCourier-298-0.png',

  // 9. Premier XL
  premier_xl: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/Minivan-DiamondSparklesNew-529.png',
  black: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/Minivan-DiamondSparklesNew-529.png',
  uber_black: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/Minivan-DiamondSparklesNew-529.png',

  // 10. Bike Saver
  bike_saver: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/MotorcycleOrange-Clock-333-0.png'
};

export const getOfficialWhiteCarImage = (tier) => {
  // If tier has imageUrl and it is explicitly a clean cloudfront PNG, use it
  if (
    tier?.imageUrl &&
    tier.imageUrl.includes('cloudfront.net') &&
    !tier.imageUrl.endsWith('.jpg') &&
    !tier.imageUrl.includes('car-images')
  ) {
    return tier.imageUrl;
  }
  const id = (tier?.vehicleTypeId || tier?.id || '').toLowerCase();
  const name = (tier?.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_');
  return (
    OFFICIAL_UBER_CAR_IMAGES[id] ||
    OFFICIAL_UBER_CAR_IMAGES[name] ||
    OFFICIAL_UBER_CAR_IMAGES.uber_go_ac
  );
};

// Curated landmarks for immediate instant recommendations
const POPULAR_PRESETS = [
  {
    id: 'p_market_st',
    name: 'Market Street',
    details: 'Downtown Financial District, San Francisco, CA',
    lat: 37.7749,
    lng: -122.4194,
    type: 'transit'
  },
  {
    id: 'p_wharf',
    name: "Fisherman's Wharf",
    details: 'Pier 39, Beach Street, San Francisco, CA',
    lat: 37.8080,
    lng: -122.4177,
    type: 'tourism'
  },
  {
    id: 'p_union_sq',
    name: 'Union Square',
    details: 'Post & Powell St, San Francisco, CA',
    lat: 37.7879,
    lng: -122.4074,
    type: 'commercial'
  },
  {
    id: 'p_sfo',
    name: 'San Francisco International Airport (SFO)',
    details: 'Terminal 2, San Francisco, CA 94128',
    lat: 37.6213,
    lng: -122.3790,
    type: 'airport'
  },
  {
    id: 'p_goldengate',
    name: 'Golden Gate Bridge',
    details: 'Golden Gate Bridge View Point, San Francisco, CA',
    lat: 37.8199,
    lng: -122.4783,
    type: 'tourism'
  },
  {
    id: 'p_ferry',
    name: 'Embarcadero Ferry Building',
    details: '1 Ferry Building, The Embarcadero, San Francisco, CA',
    lat: 37.7955,
    lng: -122.3937,
    type: 'transit'
  },
  {
    id: 'p_oracle',
    name: 'Oracle Park',
    details: '24 Willie Mays Plaza, San Francisco, CA',
    lat: 37.7786,
    lng: -122.3893,
    type: 'stadium'
  }
];

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

  // Autocomplete suggestions state
  const [activeField, setActiveField] = useState(null); // 'pickup' | 'dropoff' | null
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputsContainerRef = useRef(null);

  // Close suggestions when user clicks outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (inputsContainerRef.current && !inputsContainerRef.current.contains(e.target)) {
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Live Photon (OpenStreetMap) geocoding suggestions with debouncing
  useEffect(() => {
    if (!activeField) {
      setSuggestions([]);
      return;
    }

    const query = activeField === 'pickup' ? pickup : dropoff;
    const trimmed = (query || '').trim();

    // If query is short or empty, show popular landmarks
    if (trimmed.length < 2) {
      setSuggestions(POPULAR_PRESETS);
      setIsSearching(false);
      return;
    }

    let isMounted = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const centerLat = pickupCoords?.lat || 37.7749;
        const centerLng = pickupCoords?.lng || -122.4194;
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&lat=${centerLat}&lon=${centerLng}&limit=6`;

        const res = await fetch(url);
        const data = await res.json();

        if (!isMounted) return;

        if (data && data.features && data.features.length > 0) {
          const parsed = data.features.map((f, i) => {
            const p = f.properties || {};
            const name = p.name || p.street || trimmed;
            const addressParts = [
              p.housenumber ? `${p.housenumber} ${p.street || ''}`.trim() : p.street,
              p.district,
              p.city,
              p.state,
              p.country
            ].filter(Boolean);
            const details = addressParts.length > 0 ? addressParts.join(', ') : 'Location';

            let type = 'landmark';
            if (p.osm_key === 'aeroway' || name.toLowerCase().includes('airport')) type = 'airport';
            else if (p.osm_key === 'railway' || name.toLowerCase().includes('station')) type = 'transit';
            else if (p.osm_key === 'tourism' || p.osm_key === 'historic') type = 'tourism';

            return {
              id: `photon_${p.osm_id || i}_${Date.now()}`,
              name,
              details,
              lat: f.geometry.coordinates[1],
              lng: f.geometry.coordinates[0],
              type
            };
          });

          setSuggestions(parsed);
        } else {
          // Fallback to filtering presets
          const filtered = POPULAR_PRESETS.filter(p =>
            p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
            p.details.toLowerCase().includes(trimmed.toLowerCase())
          );
          setSuggestions(filtered);
        }
      } catch (err) {
        if (isMounted) {
          const filtered = POPULAR_PRESETS.filter(p =>
            p.name.toLowerCase().includes(trimmed.toLowerCase())
          );
          setSuggestions(filtered);
        }
      } finally {
        if (isMounted) setIsSearching(false);
      }
    }, 220);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [pickup, dropoff, activeField]);

  // Handle selecting an address suggestion
  const handleSelectSuggestion = (sug) => {
    const formatted = sug.details ? `${sug.name}, ${sug.details.split(',')[0]}` : sug.name;

    if (activeField === 'pickup') {
      setPickup(formatted);
      setPickupCoords({ lat: sug.lat, lng: sug.lng });
      if (onPickupChange) onPickupChange(formatted, { lat: sug.lat, lng: sug.lng });
    } else if (activeField === 'dropoff') {
      setDropoff(formatted);
      setDropoffCoords({ lat: sug.lat, lng: sug.lng });
      if (onDropoffChange) onDropoffChange(formatted, { lat: sug.lat, lng: sug.lng });
    }

    setActiveField(null);
  };

  // Handle calculating fares and drawing route
  const handleCalculateFare = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Fetch Fare Estimates calculated on real road distance via Leaflet / OSRM engine
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

        // Pass Leaflet road coordinates and real road distance to the interactive map
        if (onRouteCalculated) {
          const coords = fareData.data.coordinates || [
            [pickupCoords.lat, pickupCoords.lng],
            [dropoffCoords.lat, dropoffCoords.lng]
          ];
          onRouteCalculated({
            pickup: [pickupCoords.lat, pickupCoords.lng],
            dropoff: [dropoffCoords.lat, dropoffCoords.lng],
            coordinates: coords,
            distanceKm: fareData.data.distanceKm,
            durationMin: fareData.data.durationMin
          });
        }
      } else {
        setErrorMsg(fareData.message || 'Unable to calculate fare estimates.');
      }
    } catch (err) {
      setErrorMsg('Could not calculate fare. Please ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking the ride with active user identity
  const handleBookRide = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await ridesApi.requestRide({
        pickupAddress: pickup,
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lng,
        dropoffAddress: dropoff,
        dropoffLatitude: dropoffCoords.lat,
        dropoffLongitude: dropoffCoords.lng,
        vehicleType: selectedTier,
        promoCode: promoCode || undefined
      });

      if (res && res.success) {
        setBookingConfirmed(res.data);
      } else {
        setErrorMsg(res?.message || 'Ride booking failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Connection error. Could not book ride.');
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
              <div><strong>Final Fare:</strong> ₹{bookingConfirmed.final_fare || bookingConfirmed.estimated_fare}</div>
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
          {/* Connected Inputs with official light-gray background & icon connectors */}
          <div ref={inputsContainerRef} className="relative space-y-2">
            {/* Vertical connector line */}
            <div className="absolute left-[20px] top-[26px] bottom-[26px] w-[2px] bg-neutral-400 z-10 pointer-events-none"></div>

            {/* Input 1: Pickup Location */}
            <div className="relative">
              <div className="flex items-center bg-[#f3f3f3] rounded-lg border border-transparent focus-within:border-black transition">
                <div className="w-10 flex justify-center z-20">
                  {/* Official circle icon */}
                  <div className="w-3 h-3 rounded-full border-2 border-black flex items-center justify-center bg-transparent">
                    <div className="w-1 h-1 rounded-full bg-black"></div>
                  </div>
                </div>
                <input
                  type="text"
                  value={pickup}
                  onFocus={() => setActiveField('pickup')}
                  onChange={(e) => {
                    setPickup(e.target.value);
                    setActiveField('pickup');
                  }}
                  placeholder="Pickup location"
                  required
                  className="w-full bg-transparent text-black text-[15px] font-medium py-3.5 pr-16 focus:outline-none placeholder-neutral-500"
                />

                {pickup && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickup('');
                      setActiveField('pickup');
                    }}
                    className="absolute right-9 text-neutral-400 hover:text-black p-1 cursor-pointer transition"
                    title="Clear pickup"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  title="Current location"
                  onClick={() => {
                    setPickup('Market St, San Francisco, CA');
                    setPickupCoords({ lat: 37.7749, lng: -122.4194 });
                    setActiveField(null);
                  }}
                  className="absolute right-3 text-black hover:opacity-70 transition p-1 cursor-pointer"
                >
                  <Navigation className="w-4 h-4 fill-black" />
                </button>
              </div>

              {/* Autocomplete Dropdown Menu for Pickup */}
              {activeField === 'pickup' && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100 max-h-72 overflow-y-auto animate-fadeIn text-black">
                  <div className="px-4 py-2 bg-neutral-50 flex items-center justify-between text-[11px] text-neutral-500 font-semibold border-b border-neutral-100">
                    <span>{isSearching ? 'Searching locations...' : 'Suggested Pickup Locations'}</span>
                    {isSearching ? (
                      <Loader2 className="w-3 h-3 animate-spin text-neutral-600" />
                    ) : (
                      <span className="text-[10px] text-neutral-400">OpenStreetMap</span>
                    )}
                  </div>

                  {/* Quick current GPS location button */}
                  <button
                    type="button"
                    onClick={() => {
                      if ('geolocation' in navigator) {
                        navigator.geolocation.getCurrentPosition(
                          (pos) => {
                            const lat = pos.coords.latitude;
                            const lng = pos.coords.longitude;
                            const formatted = `Current Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
                            setPickup(formatted);
                            setPickupCoords({ lat, lng });
                            if (onPickupChange) onPickupChange(formatted, { lat, lng });
                            setActiveField(null);
                          },
                          () => {
                            setPickup('Market St, San Francisco, CA');
                            setPickupCoords({ lat: 37.7749, lng: -122.4194 });
                            setActiveField(null);
                          }
                        );
                      }
                    }}
                    className="w-full px-4 py-3 text-left flex items-center space-x-3 hover:bg-neutral-50 transition cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Navigation className="w-4 h-4 fill-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-neutral-900 group-hover:text-black">Use Current Location</div>
                      <div className="text-xs text-neutral-500">Auto-detect GPS location</div>
                    </div>
                  </button>

                  {/* Suggestion list */}
                  {suggestions.length > 0 ? (
                    suggestions.map((sug) => (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className="w-full px-4 py-3 text-left flex items-start space-x-3 hover:bg-neutral-50 transition cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                          {sug.type === 'airport' ? (
                            <Plane className="w-4 h-4 text-sky-600" />
                          ) : sug.type === 'transit' ? (
                            <Train className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <MapPin className="w-4 h-4 text-neutral-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-neutral-900 group-hover:text-black truncate">
                            {sug.name}
                          </div>
                          <div className="text-xs text-neutral-500 truncate mt-0.5">
                            {sug.details}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : !isSearching ? (
                    <div className="px-4 py-5 text-center text-xs text-neutral-500">
                      No matching addresses found. Try a landmark or city.
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Input 2: Dropoff Location */}
            <div className="relative">
              <div className="flex items-center bg-[#f3f3f3] rounded-lg border border-transparent focus-within:border-black transition">
                <div className="w-10 flex justify-center z-20">
                  {/* Official solid square icon */}
                  <div className="w-2.5 h-2.5 bg-black"></div>
                </div>
                <input
                  type="text"
                  value={dropoff}
                  onFocus={() => setActiveField('dropoff')}
                  onChange={(e) => {
                    setDropoff(e.target.value);
                    setActiveField('dropoff');
                  }}
                  placeholder="Dropoff location"
                  required
                  className="w-full bg-transparent text-black text-[15px] font-medium py-3.5 pr-10 focus:outline-none placeholder-neutral-500"
                />

                {dropoff && (
                  <button
                    type="button"
                    onClick={() => {
                      setDropoff('');
                      setActiveField('dropoff');
                    }}
                    className="absolute right-3 text-neutral-400 hover:text-black p-1 cursor-pointer transition"
                    title="Clear destination"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown Menu for Dropoff */}
              {activeField === 'dropoff' && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden divide-y divide-neutral-100 max-h-72 overflow-y-auto animate-fadeIn text-black">
                  <div className="px-4 py-2 bg-neutral-50 flex items-center justify-between text-[11px] text-neutral-500 font-semibold border-b border-neutral-100">
                    <span>{isSearching ? 'Searching locations...' : 'Suggested Dropoff Destinations'}</span>
                    {isSearching ? (
                      <Loader2 className="w-3 h-3 animate-spin text-neutral-600" />
                    ) : (
                      <span className="text-[10px] text-neutral-400">OpenStreetMap</span>
                    )}
                  </div>

                  {/* Suggestion list */}
                  {suggestions.length > 0 ? (
                    suggestions.map((sug) => (
                      <button
                        key={sug.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className="w-full px-4 py-3 text-left flex items-start space-x-3 hover:bg-neutral-50 transition cursor-pointer group"
                      >
                        <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                          {sug.type === 'airport' ? (
                            <Plane className="w-4 h-4 text-sky-600" />
                          ) : sug.type === 'transit' ? (
                            <Train className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <MapPin className="w-4 h-4 text-neutral-700" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-neutral-900 group-hover:text-black truncate">
                            {sug.name}
                          </div>
                          <div className="text-xs text-neutral-500 truncate mt-0.5">
                            {sug.details}
                          </div>
                        </div>
                      </button>
                    ))
                  ) : !isSearching ? (
                    <div className="px-4 py-5 text-center text-xs text-neutral-500">
                      No matching addresses found. Try a landmark or city.
                    </div>
                  ) : null}
                </div>
              )}
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
            <div className="space-y-3 pt-2 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between text-xs px-1 gap-2">
                <h5 className="text-sm font-black text-white tracking-tight">
                  Rides we think you'll like
                </h5>
                <div className="flex items-center space-x-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full text-neutral-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="font-semibold text-white">{estimates.distanceKm} km</span>
                  <span className="text-neutral-500">·</span>
                  <span>{estimates.durationMin} min</span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {estimates.estimates.map((tier) => {
                  const carImgSrc = getOfficialWhiteCarImage(tier);

                  const isSelected = selectedTier === tier.vehicleTypeId;
                  const arrivalTime = new Date(Date.now() + (tier.durationMin || 5) * 60000).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={tier.vehicleTypeId}
                      onClick={() => setSelectedTier(tier.vehicleTypeId)}
                      className={`flex items-center justify-between p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all select-none ${
                        isSelected
                          ? 'bg-neutral-900 border-2 border-white shadow-2xl'
                          : 'bg-black border border-neutral-800/80 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 sm:space-x-4">
                        {/* Official Uber 3D Transparent Car Render */}
                        <div className="w-20 h-16 sm:w-22 sm:h-18 flex items-center justify-center shrink-0">
                          <img
                            src={carImgSrc}
                            alt={tier.name}
                            className="w-full h-full object-contain drop-shadow"
                            loading="lazy"
                          />
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-extrabold text-[15px] sm:text-base text-white tracking-tight">
                              {tier.name}
                            </span>
                            <span className="flex items-center text-xs text-neutral-400 font-semibold">
                              <User className="w-3 h-3 ml-0.5 mr-0.5 text-neutral-300" />
                              {tier.capacity}
                            </span>
                          </div>

                          <p className="text-xs text-neutral-400 font-medium">
                            {tier.durationMin || '5'} mins away
                            <span className="mx-1">•</span>
                            {arrivalTime}
                          </p>

                          <div className="text-[11px] text-neutral-400">
                            {tier.description || 'Affordable everyday rides'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right pl-3 shrink-0">
                        <div className="text-lg sm:text-xl font-black text-white tracking-tight">
                          ₹{Number(tier.finalFare).toFixed(2)}
                        </div>
                        {tier.discountAmount > 0 && (
                          <span className="block text-xs line-through text-neutral-500 font-medium">
                            ₹{Number(tier.subtotal).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
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
