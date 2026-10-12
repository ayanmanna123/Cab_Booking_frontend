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
  Train,
  Phone,
  MessageSquare,
  Shield,
  ShieldCheck,
  Star,
  Key,
  Sparkles,
  Check
} from 'lucide-react';
import { CONFIG } from '../../constants/config';
import { ridesApi } from '../../api';
import { useSocketContext } from '../../context/SocketContext';
import { SOCKET_EVENTS } from '../../constants/socketEvents';

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
  const [selectedTier, setSelectedTier] = useState('uber_go_ac');
  const [bookingConfirmed, setBookingConfirmed] = useState(null);
  const [acceptedDriver, setAcceptedDriver] = useState(null);
  const [rideTripStatus, setRideTripStatus] = useState('SEARCHING'); // 'SEARCHING' | 'ACCEPTED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  const [searchingTimedOut, setSearchingTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Rating and feedback state on ride completion
  const [driverRating, setDriverRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const { socket } = useSocketContext();

  // Helper to parse driver details from backend or socket payloads
  const parseDriverDetails = (r) => {
    if (!r?.driver) return null;
    const dp = r.driver.driver_profile || r.driver;
    const du = r.driver.driver_user || dp.driver_user || dp.cb_users || {};
    const cleanPlate = (dp.license_plate || dp.licensePlate || 'MH 02 CZ 4488').trim();
    return {
      rideId: r.id,
      driverId: r.driver_id || dp.id,
      driverName: du.full_name || dp.full_name || dp.driverName || 'Driver Partner',
      driverPhone: du.phone || dp.phone || '+91 98765 43210',
      driverPhoto: du.avatar_url || dp.avatar_url || dp.driverPhoto || dp.car_image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      vehicleMake: dp.vehicle_make || dp.vehicleMake || 'Toyota',
      vehicleModel: dp.vehicle_model || dp.vehicleModel || 'Camry',
      vehicleColor: dp.vehicle_color || dp.vehicleColor || 'Silver Metallic',
      licensePlate: cleanPlate,
      carLast4: cleanPlate.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '4488',
      rating: Number(dp.rating || 4.98),
      totalTrips: Number(dp.total_rides || dp.totalTrips || 1240)
    };
  };

  // Restore active ride on mount if rider reloads page
  useEffect(() => {
    let isMounted = true;
    const restoreActiveRide = async () => {
      try {
        const res = await ridesApi.getActiveRide();
        if (res && res.success && res.data && isMounted) {
          const r = res.data;
          setBookingConfirmed(r);
          setRideTripStatus(r.status);
          const pLat = Number(r.pickup_latitude);
          const pLng = Number(r.pickup_longitude);
          const dLat = Number(r.dropoff_latitude);
          const dLng = Number(r.dropoff_longitude);
          if (pLat && pLng) setPickupCoords({ lat: pLat, lng: pLng });
          if (dLat && dLng) setDropoffCoords({ lat: dLat, lng: dLng });
          if (r.pickup_address) setPickup(r.pickup_address);
          if (r.dropoff_address) setDropoff(r.dropoff_address);

          if (onRouteCalculated && pLat && pLng && dLat && dLng) {
            onRouteCalculated({
              pickup: [pLat, pLng],
              dropoff: [dLat, dLng],
              coordinates: [[pLat, pLng], [dLat, dLng]],
              distanceKm: 5.2,
              durationMin: 14
            });
          }

          const driverParsed = parseDriverDetails(r);
          if (driverParsed) {
            setAcceptedDriver(driverParsed);
            setSearchingTimedOut(false);
          }
          if (r.status === 'IN_PROGRESS') {
            window.history.pushState({}, '', '/tracking');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }
        }
      } catch {
        // Not logged in or no active ride
      }
    };

    restoreActiveRide();
    return () => { isMounted = false; };
  }, []);

  // Live Active Ride Sync Polling: updates rider immediately when driver accepts/arrives/starts/completes
  useEffect(() => {
    if (!bookingConfirmed?.id) return;
    if (rideTripStatus === 'COMPLETED' || rideTripStatus === 'CANCELLED') return;

    let isMounted = true;
    const pollInterval = setInterval(async () => {
      try {
        const res = await ridesApi.getActiveRide();
        if (res?.success && res.data && isMounted) {
          const r = res.data;
          if (r.id === bookingConfirmed.id) {
            if (r.status !== rideTripStatus) {
              setRideTripStatus(r.status);
              if (r.status === 'IN_PROGRESS') {
                window.history.pushState({}, '', '/tracking');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }
            }
            if (r.status !== 'SEARCHING' && r.status !== 'REQUESTED') {
              setSearchingTimedOut(false);
            }
            if (r.driver && !acceptedDriver) {
              const parsed = parseDriverDetails(r);
              if (parsed) {
                setAcceptedDriver(parsed);
                setSearchingTimedOut(false);
              }
            }
          }
        }
      } catch {}
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [bookingConfirmed?.id, rideTripStatus, acceptedDriver]);

  // 30-second driver searching timeout
  useEffect(() => {
    let timer = null;
    if (bookingConfirmed && !acceptedDriver && (rideTripStatus === 'SEARCHING' || rideTripStatus === 'REQUESTED')) {
      timer = setTimeout(() => {
        setSearchingTimedOut(true);
      }, 30000);
    } else {
      setSearchingTimedOut(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [bookingConfirmed?.id, acceptedDriver, rideTripStatus]);

  // Listen for driver acceptance & trip progression via socket, cross-tab channel, storage, or window events
  useEffect(() => {
    const handleDriverAccepted = (driver) => {
      console.log('🎉 Driver accepted your ride request:', driver);
      setAcceptedDriver(driver);
      setRideTripStatus('ACCEPTED');
      setSearchingTimedOut(false);
    };

    const handleDriverArrived = () => {
      console.log('📍 Driver arrived at pickup location!');
      setRideTripStatus('ARRIVED');
    };

    const handleRideInProgress = () => {
      console.log('🚀 Driver verified PIN, trip is in progress! Navigating to live map...');
      setRideTripStatus('IN_PROGRESS');
      window.history.pushState({}, '', '/tracking');
      window.dispatchEvent(new PopStateEvent('popstate'));
    };

    const handleRideCompleted = () => {
      console.log('🎉 Ride completed by driver!');
      setRideTripStatus('COMPLETED');
    };

    const handleRideCancelled = () => {
      console.log('❌ Ride cancelled');
      setRideTripStatus('CANCELLED');
    };

    if (socket) {
      const onStatusChange = (data) => {
        if (!data) return;
        const currentRideId = bookingConfirmed?.id;
        if (currentRideId && data.rideId && data.rideId !== currentRideId) {
          return;
        }

        if (data.status === 'ACCEPTED' && data.driver) {
          handleDriverAccepted(data.driver);
        } else if (data.status === 'ARRIVED') {
          handleDriverArrived();
        } else if (data.status === 'IN_PROGRESS' || data.type === 'RIDE_IN_PROGRESS') {
          handleRideInProgress();
        } else if (data.status === 'COMPLETED' || data.type === 'RIDE_COMPLETED') {
          handleRideCompleted();
        } else if (data.status === 'CANCELLED') {
          handleRideCancelled();
        }
      };

      socket.on(SOCKET_EVENTS.RIDE_STATUS_CHANGE, onStatusChange);
      socket.on('ride:accept', handleDriverAccepted);
      socket.on('ride:accepted', (data) => handleDriverAccepted(data?.driver || data));
      socket.on(SOCKET_EVENTS.RIDE_ACCEPTED, (data) => handleDriverAccepted(data?.driver || data));
      socket.on(SOCKET_EVENTS.RIDE_ARRIVED, handleDriverArrived);
      socket.on(SOCKET_EVENTS.RIDE_STARTED, handleRideInProgress);
      socket.on(SOCKET_EVENTS.RIDE_COMPLETED, handleRideCompleted);
      socket.on(SOCKET_EVENTS.RIDE_CANCELLED, handleRideCancelled);
    }

    let channel = null;
    try {
      channel = new BroadcastChannel('uber_dispatch_channel');
      channel.onmessage = (event) => {
        if (event.data) {
          if (event.data.type === 'RIDE_ACCEPTED') {
            handleDriverAccepted(event.data);
          } else if (event.data.type === 'RIDE_ARRIVED') {
            handleDriverArrived();
          } else if (event.data.type === 'RIDE_IN_PROGRESS') {
            handleRideInProgress();
          } else if (event.data.type === 'RIDE_COMPLETED') {
            handleRideCompleted();
          } else if (event.data.type === 'RIDE_CANCELLED') {
            handleRideCancelled();
          }
        }
      };
    } catch {}

    const customAccept = (e) => {
      if (e.detail) handleDriverAccepted(e.detail);
    };
    const customArrived = () => handleDriverArrived();
    const customProgress = () => handleRideInProgress();
    const customComplete = () => handleRideCompleted();
    const customCancelled = () => handleRideCancelled();

    const handleStorageEvent = (e) => {
      if (e.key === 'uber_active_accepted_driver' && e.newValue) {
        try {
          handleDriverAccepted(JSON.parse(e.newValue));
        } catch {}
      }
    };

    window.addEventListener('uber_ride_accepted', customAccept);
    window.addEventListener('uber_ride_arrived', customArrived);
    window.addEventListener('uber_ride_in_progress', customProgress);
    window.addEventListener('uber_ride_completed', customComplete);
    window.addEventListener('uber_ride_cancelled', customCancelled);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.RIDE_STATUS_CHANGE);
        socket.off('ride:accept', handleDriverAccepted);
        socket.off(SOCKET_EVENTS.RIDE_ARRIVED, handleDriverArrived);
        socket.off(SOCKET_EVENTS.RIDE_STARTED, handleRideInProgress);
        socket.off(SOCKET_EVENTS.RIDE_COMPLETED, handleRideCompleted);
        socket.off(SOCKET_EVENTS.RIDE_CANCELLED, handleRideCancelled);
      }
      if (channel) channel.close();
      window.removeEventListener('uber_ride_accepted', customAccept);
      window.removeEventListener('uber_ride_arrived', customArrived);
      window.removeEventListener('uber_ride_in_progress', customProgress);
      window.removeEventListener('uber_ride_completed', customComplete);
      window.removeEventListener('uber_ride_cancelled', customCancelled);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [socket, bookingConfirmed?.id]);

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
    setErrorMsg('');

    if (!pickup?.trim() || !dropoff?.trim()) {
      setErrorMsg('Please select both pickup and destination locations.');
      return;
    }

    if (
      pickup.trim().toLowerCase() === dropoff.trim().toLowerCase() ||
      (Math.abs(pickupCoords.lat - dropoffCoords.lat) < 0.0001 && Math.abs(pickupCoords.lng - dropoffCoords.lng) < 0.0001)
    ) {
      setErrorMsg('Pickup and destination must be different locations.');
      return;
    }

    setLoading(true);

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
        setAcceptedDriver(null);
        setRideTripStatus('SEARCHING');
        setSearchingTimedOut(false);

        const currentTierObj = estimates?.estimates?.find((t) => t.vehicleTypeId === selectedTier);
        const tierTitle = currentTierObj?.name || selectedTier.toUpperCase();

        const dispatchPayload = {
          rideId: res.data.id,
          pickupAddress: pickup,
          dropoffAddress: dropoff,
          pickupLatitude: pickupCoords.lat,
          pickupLongitude: pickupCoords.lng,
          dropoffLatitude: dropoffCoords.lat,
          dropoffLongitude: dropoffCoords.lng,
          estimatedFare: res.data.final_fare || res.data.estimated_fare,
          vehicleType: selectedTier,
          vehicleTier: tierTitle,
          timestamp: Date.now()
        };

        try {
          const channel = new BroadcastChannel('uber_dispatch_channel');
          channel.postMessage({ type: 'NEW_OFFER', ...dispatchPayload });
          channel.close();
        } catch {}

        window.dispatchEvent(new CustomEvent('uber_driver_offer', { detail: dispatchPayload }));
      } else {
        setErrorMsg(res?.message || 'Ride booking failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Connection error. Could not book ride.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    const rideId = bookingConfirmed?.id;
    if (rideId) {
      try {
        await ridesApi.cancelRide(rideId, 'Rider cancelled request');
      } catch (err) {
        console.warn('Cancel ride API error:', err);
      }
    }
    setBookingConfirmed(null);
    setAcceptedDriver(null);
    setRideTripStatus('SEARCHING');
    setSearchingTimedOut(false);
    try {
      localStorage.removeItem('uber_active_accepted_driver');
    } catch {}
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPickupCoords({ lat, lng });
          const formatted = `Current Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;
          setPickup(formatted);
          if (onPickupChange) onPickupChange(formatted, { lat, lng });
          setActiveField(null);
        },
        () => {
          setErrorMsg('Location permission denied or unavailable. Please type your pickup location.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setErrorMsg('Geolocation is not supported by your browser.');
    }
  };

  const selectedTierName =
    estimates?.estimates?.find((t) => t.vehicleTypeId === selectedTier)?.name ||
    selectedTier.toUpperCase();

  return (
    <div className="w-full max-w-[500px] text-white">
      {/* 1. City selector row matching official Uber: San Francisco, CA  Change city */}
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
        /* Booking Lifecycle State Machine */
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl space-y-5 animate-fadeIn shadow-2xl">
          {/* Case 1: Trip Completed */}
          {rideTripStatus === 'COMPLETED' ? (
            <div className="bg-emerald-950/80 border-2 border-emerald-500/80 p-5 sm:p-6 rounded-3xl space-y-5 animate-in zoom-in-95 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl">
              <div className="flex items-center space-x-3 pb-3 border-b border-emerald-800/60">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-black font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Your trip has been completed</h3>
                  <p className="text-xs text-neutral-300">Hope you had a safe and comfortable ride!</p>
                </div>
              </div>

              {/* Ride Summary & Final Fare */}
              <div className="bg-black/90 p-4 rounded-2xl border border-neutral-800 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <span className="text-neutral-400">Total Charged Fare</span>
                  <span className="font-mono text-xl font-black text-emerald-400">
                    ₹{Number(bookingConfirmed.final_fare || bookingConfirmed.estimated_fare || 180).toFixed(2)}
                  </span>
                </div>
                <div className="space-y-1.5 text-neutral-300">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">From</span>
                    <span className="font-semibold">{bookingConfirmed.pickup_address}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-500 block">To</span>
                    <span className="font-semibold">{bookingConfirmed.dropoff_address}</span>
                  </div>
                  {acceptedDriver && (
                    <div className="pt-2 border-t border-neutral-900 flex justify-between items-center text-neutral-400">
                      <span>Driver: <strong className="text-white">{acceptedDriver.driverName}</strong></span>
                      <span className="font-mono text-neutral-300">{acceptedDriver.vehicleMake} · {acceptedDriver.licensePlate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rate Driver & Feedback */}
              <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {feedbackSubmitted ? 'Thank You for Rating!' : 'Rate Your Driver & Trip'}
                </h4>

                {!feedbackSubmitted ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setDriverRating(star)}
                          className="p-1 hover:scale-110 transition cursor-pointer text-amber-400"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              star <= driverRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-700'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="text-xs font-bold text-amber-400 ml-2">
                        {driverRating === 5 ? '5.0 (Excellent)' : `${driverRating}.0`}
                      </span>
                    </div>

                    <textarea
                      rows={2}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Leave a compliment or feedback (optional)..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                    />

                    <button
                      type="button"
                      onClick={() => setFeedbackSubmitted(true)}
                      className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Submit Feedback
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Your rating has been submitted. Thank you for riding with Uber!</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCancelRide}
                className="w-full py-3.5 bg-white text-black font-extrabold text-sm rounded-xl hover:bg-neutral-200 transition cursor-pointer shadow-md"
              >
                Book Another Ride
              </button>
            </div>
          ) : (acceptedDriver || ['ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS'].includes(rideTripStatus) || ['ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS'].includes(bookingConfirmed?.status)) ? (() => {
            const activeDriver = acceptedDriver || parseDriverDetails(bookingConfirmed) || {
              driverName: 'Ayan Manna',
              driverPhone: '+91 98765 43210',
              driverPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
              vehicleMake: 'Toyota',
              vehicleModel: 'Camry',
              vehicleColor: 'Silver Metallic',
              licensePlate: 'MH 02 CZ 4488',
              carLast4: '4488',
              rating: 4.98,
              totalTrips: 1240
            };
            return (
              /* Case 2: Driver Assigned (ACCEPTED, ARRIVED, IN_PROGRESS) */
              <div className="bg-emerald-950/80 border-2 border-emerald-500/80 p-5 sm:p-6 rounded-3xl space-y-4 animate-in zoom-in-95 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl">
                {/* Top Banner Status */}
                <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                      {rideTripStatus === 'IN_PROGRESS'
                        ? 'Your trip has started • Live on route'
                        : rideTripStatus === 'ARRIVED'
                        ? 'Your driver has arrived at the pickup location'
                        : 'Your driver has accepted your ride • On the way'}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {rideTripStatus === 'IN_PROGRESS'
                      ? 'On Route'
                      : rideTripStatus === 'ARRIVED'
                      ? 'Driver Arrived'
                      : 'ETA ~3 mins'}
                  </span>
                </div>

                {/* Driver Profile & Contact */}
                <div className="bg-black/90 p-4 sm:p-5 rounded-2xl border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-neutral-900 shadow-md">
                          <img
                            src={activeDriver.driverPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'}
                            alt={activeDriver.driverName || 'Driver'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-black stroke-[3]" />
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-extrabold text-white">
                            {activeDriver.driverName || 'Driver'}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-neutral-400 mt-0.5">
                          <span className="text-amber-400 font-bold flex items-center">
                            <Star className="w-3.5 h-3.5 fill-amber-400 mr-1 inline" />
                            {activeDriver.rating || '5.0'}
                          </span>
                          {activeDriver.totalTrips != null && (
                            <>
                              <span>·</span>
                              <span>{activeDriver.totalTrips} trips</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Call Driver Button */}
                    <a
                      href={`tel:${activeDriver.driverPhone || '+919876543210'}`}
                      className="p-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl transition shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center cursor-pointer"
                      title="Call Driver"
                    >
                      <Phone className="w-5 h-5 fill-black" />
                    </a>
                  </div>

                  {/* Car Details & License Plate */}
                  <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-neutral-500 block text-[10px] uppercase font-bold tracking-wider">
                          Vehicle Model
                        </span>
                        <span className="text-sm font-bold text-white">
                          {activeDriver.vehicleMake} {activeDriver.vehicleModel}
                        </span>
                        <span className="text-xs text-neutral-400 block">
                          Color: {activeDriver.vehicleColor || 'Silver'}
                        </span>
                      </div>

                      {/* Spotlight: LAST 4 DIGITS OF CAR PLATE */}
                      <div className="text-right">
                        <span className="text-[10px] text-amber-400 uppercase font-black tracking-wider block">
                          Last 4 Digits
                        </span>
                        <span className="font-mono text-2xl font-black text-amber-400 bg-amber-400/10 px-3.5 py-1 rounded-xl border border-amber-400/40 inline-block shadow-lg shadow-amber-400/10">
                          {activeDriver.carLast4 || (activeDriver.licensePlate || '4488').replace(/[^a-zA-Z0-9]/g, '').slice(-4)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-neutral-900 text-xs">
                      <span className="text-neutral-400">Full Number Plate:</span>
                      <span className="font-mono font-bold text-neutral-200 bg-neutral-900 px-2.5 py-0.5 rounded border border-neutral-800">
                        {activeDriver.licensePlate || 'DL 01 AB 1234'}
                      </span>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl text-[11px] text-amber-300 flex items-center space-x-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Always verify the <strong>last 4 digits ({activeDriver.carLast4 || (activeDriver.licensePlate || '4488').replace(/[^a-zA-Z0-9]/g, '').slice(-4)})</strong> before boarding.</span>
                    </div>
                  </div>
                </div>

                {/* Ride PIN Card (Hidden once PIN is entered & verified) */}
                {rideTripStatus !== 'IN_PROGRESS' && bookingConfirmed?.status !== 'IN_PROGRESS' ? (
                  <div className="bg-black border-2 border-amber-500/40 p-4 rounded-2xl space-y-2.5 shadow-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs text-amber-400 uppercase tracking-wider font-extrabold block">
                          Ride Verification PIN
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Share with driver when they arrive
                        </span>
                      </div>
                      <span className="text-3xl font-mono font-black text-amber-400 tracking-widest bg-amber-400/10 px-4 py-1.5 rounded-2xl border-2 border-amber-400/30 shadow-lg shadow-amber-400/10">
                        {bookingConfirmed.otp || '4829'}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-normal border-t border-neutral-800 pt-2 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <em>Share this PIN with your driver when they arrive. Never share it before verifying the driver and vehicle.</em>
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-2xl flex items-center justify-between shadow-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wider block">
                          PIN Verified · On Trip
                        </span>
                        <span className="text-[11px] text-neutral-300">
                          En route to destination
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        window.history.pushState({}, '', '/tracking');
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      View Live Map
                    </button>
                  </div>
                )}

                {/* Ride Summary */}
                <div className="bg-black border border-neutral-800 p-4 rounded-2xl text-xs space-y-2 text-neutral-300">
                  <div className="flex justify-between items-center text-[11px] text-neutral-500 pb-1 border-b border-neutral-800">
                    <span>Ride ID:</span>
                    <span className="font-mono font-bold text-neutral-300">{bookingConfirmed.id}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Pickup</span>
                    <span className="font-semibold text-white">{bookingConfirmed.pickup_address}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Destination</span>
                    <span className="font-semibold text-white">{bookingConfirmed.dropoff_address}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-800">
                    <span className="text-neutral-400">Total Fare:</span>
                    <span className="font-extrabold text-white text-base">
                      ₹{Number(bookingConfirmed.final_fare || bookingConfirmed.estimated_fare).toFixed(2)}
                    </span>
                  </div>
                </div>

                {rideTripStatus !== 'IN_PROGRESS' && (
                  <button
                    type="button"
                    onClick={handleCancelRide}
                    className="w-full py-3 bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white hover:bg-neutral-800 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel Ride
                  </button>
                )}
              </div>
            );
          })() : (
            /* Case 3: Searching For Drivers */
            <div className="space-y-5">
              {searchingTimedOut ? (
                /* No Driver Available Timeout Message */
                <div className="bg-neutral-950 border border-amber-500/50 p-6 rounded-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-white">No Drivers Available Right Now</h3>
                    <p className="text-xs text-neutral-300 max-w-sm mx-auto leading-relaxed">
                      No drivers are currently available for this vehicle category. Please try again or select another vehicle.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchingTimedOut(false);
                        // Re-trigger dispatch
                        const dispatchPayload = {
                          rideId: bookingConfirmed.id,
                          pickupAddress: pickup,
                          dropoffAddress: dropoff,
                          pickupLatitude: pickupCoords.lat,
                          pickupLongitude: pickupCoords.lng,
                          dropoffLatitude: dropoffCoords.lat,
                          dropoffLongitude: dropoffCoords.lng,
                          estimatedFare: bookingConfirmed.final_fare || bookingConfirmed.estimated_fare,
                          vehicleType: selectedTier,
                          vehicleTier: selectedTierName,
                          timestamp: Date.now()
                        };
                        try {
                          const channel = new BroadcastChannel('uber_dispatch_channel');
                          channel.postMessage({ type: 'NEW_OFFER', ...dispatchPayload });
                          channel.close();
                        } catch {}
                        window.dispatchEvent(new CustomEvent('uber_driver_offer', { detail: dispatchPayload }));
                      }}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition cursor-pointer"
                    >
                      Try Again
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelRide}
                      className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Select Another Vehicle
                    </button>
                  </div>
                </div>
              ) : (
                /* Live Searching Radar Animation */
                <div className="bg-neutral-950 p-6 rounded-2xl border border-neutral-800 space-y-5 text-center">
                  <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                    <span className="w-10 h-10 rounded-full bg-emerald-500/30 border border-emerald-400/60 flex items-center justify-center">
                      <Car className="w-5 h-5 text-emerald-300" />
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white">Searching for Drivers...</h3>
                    <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                      Contacting nearby online drivers for <strong>{selectedTierName}</strong>. You will be notified the second a driver accepts.
                    </p>
                  </div>

                  <div className="bg-neutral-900/80 p-3.5 rounded-xl border border-neutral-800 text-xs text-left space-y-1.5">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>Pickup:</span>
                      <span className="font-semibold text-white truncate max-w-[240px]">{pickup}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400">
                      <span>Destination:</span>
                      <span className="font-semibold text-white truncate max-w-[240px]">{dropoff}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-400 pt-1 border-t border-neutral-800">
                      <span>Est. Fare:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        ₹{Number(bookingConfirmed.final_fare || bookingConfirmed.estimated_fare).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCancelRide}
                    className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-300 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Cancel Request
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Official Uber Search Form */
        <form onSubmit={handleCalculateFare} className="space-y-4">
          {/* Pickup time selector button */}
          <div className="relative inline-block">
            <button
              type="button"
              onClick={() => setShowTimeModal(!showTimeModal)}
              className="inline-flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg font-semibold text-sm hover:bg-neutral-200 transition shadow-sm cursor-pointer"
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
            <div className="absolute left-[21px] -translate-x-1/2 top-[24px] bottom-[24px] w-[2px] bg-neutral-400 z-10 pointer-events-none"></div>

            {/* Input 1: Pickup Location */}
            <div className="relative">
              <div className="flex items-center bg-[#f3f3f3] rounded-lg border border-transparent focus-within:border-black transition">
                <div className="w-10 shrink-0 flex items-center justify-center z-20">
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
                  title="Use current location"
                  onClick={handleUseCurrentLocation}
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
                    onClick={handleUseCurrentLocation}
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
                <div className="w-10 shrink-0 flex items-center justify-center z-20">
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
                      id={`ride-tier-${tier.vehicleTypeId}`}
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
                id="see-prices-btn"
                type="submit"
                disabled={loading}
                className="px-6 py-3.5 bg-white text-black font-bold text-sm rounded-lg hover:bg-neutral-200 transition active:scale-[0.98] disabled:opacity-50 shadow-md cursor-pointer"
              >
                {loading ? 'Calculating...' : 'See prices'}
              </button>
            ) : (
              <button
                id="request-ride-submit-btn"
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
