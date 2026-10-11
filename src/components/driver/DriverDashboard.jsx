import React, { useState, useEffect, useRef } from 'react';
import {
  Power,
  DollarSign,
  TrendingUp,
  MapPin,
  Navigation,
  ShieldCheck,
  Clock,
  Car,
  UserPlus,
  CheckCircle2,
  FileCheck,
  CreditCard,
  Loader2,
  Radio,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Award,
  Zap,
  Check,
  Phone,
  Mail,
  User,
  AlertCircle,
  Upload,
  Camera,
  Key,
  CornerUpRight,
  Compass,
  Lock,
  Unlock,
  Volume2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import InteractiveMap from '../map/InteractiveMap';
import IncomingOfferModal from './IncomingOfferModal';
import DriverRegistrationModal from './DriverRegistrationModal';
import { useSocketContext } from '../../context/SocketContext';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { driversApi, ridesApi } from '../../api';

// Helper to reliably normalize driver profiles and display the user's uploaded image
export const getDriverCarImage = (url, typeId) => {
  // If the user uploaded an image (or provided a custom image URL/data URL/blob/Supabase URL), ALWAYS prioritize and display the user's uploaded image!
  if (url && typeof url === 'string' && url.trim().length > 0) {
    return url;
  }
  const tid = (typeId || '').toLowerCase();
  if (tid.includes('xl')) return 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/MinivanLuggage-169-0.png';
  if (tid.includes('bike') || tid.includes('moto')) return 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/MotorcycleOrange-249-0.png';
  if (tid.includes('comfort') || tid.includes('premier')) return 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/SedanComfort-Sparkles-523.png';
  return 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/HatchbackMini-Snowflake-520.png';
};

const normalizeDriverProfile = (raw) => {
  if (!raw) return null;
  return {
    id: raw.id || 'demo_driver_1',
    fullName: raw.fullName || raw.full_name || raw.cb_users?.full_name || 'Driver Partner',
    phone: raw.phone || raw.cb_users?.phone || '',
    email: raw.email || raw.cb_users?.email || '',
    vehicleMake: raw.vehicleMake || raw.vehicle_make || 'Maruti Suzuki',
    vehicleModel: raw.vehicleModel || raw.vehicle_model || 'Swift Dzire',
    vehicleYear: raw.vehicleYear || raw.vehicle_year || 2024,
    vehicleColor: raw.vehicleColor || raw.vehicle_color || 'White',
    licensePlate: raw.licensePlate || raw.license_plate || 'DL 01 AB 1234',
    vehicleTypeId: raw.vehicleTypeId || raw.vehicle_type_id || 'uber_go_ac',
    carImageUrl: getDriverCarImage(raw.carImageUrl || raw.car_image_url, raw.vehicleTypeId || raw.vehicle_type_id),
    aadhaarNumber: raw.aadhaarNumber || raw.aadhaar_number || (raw.stripe_account_id?.replace('AADHAAR:', '') || ''),
    drivingLicense: raw.drivingLicense || raw.driving_license || '',
    payoutMethod: raw.payoutMethod || raw.payout_method || 'UPI',
    upiId: raw.upiId || raw.upi_id || '',
    emergencyContactName: raw.emergencyContactName || raw.emergency_contact_name || '',
    emergencyContactPhone: raw.emergencyContactPhone || raw.emergency_contact_phone || '',
    totalEarnings: Number(raw.totalEarnings ?? raw.total_earnings ?? 0),
    totalRides: Number(raw.totalRides ?? raw.total_rides ?? 0),
    rating: Number(raw.rating || 5.0)
  };
};

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [driverLocation, setDriverLocation] = useState([37.7749, -122.4194]);
  const [locationLabel, setLocationLabel] = useState('San Francisco, CA');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [activeRide, setActiveRide] = useState(() => {
    try {
      const saved = localStorage.getItem('driver_active_ride');
      if (saved && saved !== 'none') {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch {}
    return null;
  });
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState(null);
  const [pinSuccess, setPinSuccess] = useState(false);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);
  const [isNavigatingMode, setIsNavigatingMode] = useState(false);
  const [activeRideRoute, setActiveRideRoute] = useState([]);
  const [activeRideDistance, setActiveRideDistance] = useState('4.2 km');
  const [activeRideDuration, setActiveRideDuration] = useState('12 mins');
  const mapSectionRef = useRef(null);
  const pinInput0Ref = useRef(null);
  const pinInput1Ref = useRef(null);
  const pinInput2Ref = useRef(null);
  const pinInput3Ref = useRef(null);
  const pinInputRefs = [pinInput0Ref, pinInput1Ref, pinInput2Ref, pinInput3Ref];

  // Fetch real road route geometry from OSRM when active ride is loaded
  useEffect(() => {
    if (!activeRide) {
      setActiveRideRoute([]);
      return;
    }
    const pickup = activeRide.pickupCoords || [22.6113, 88.4202];
    const dropoff = activeRide.dropoffCoords || [22.5804, 88.4378];

    let isSubscribed = true;
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${pickup[1]},${pickup[0]};${dropoff[1]},${dropoff[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.routes?.[0] && isSubscribed) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          setActiveRideRoute(coords);
          setActiveRideDistance((route.distance / 1000).toFixed(1) + ' km');
          setActiveRideDuration(Math.max(1, Math.round(route.duration / 60)) + ' mins');
          return;
        }
      } catch (err) {
        console.warn('OSRM routing fetch failed, using fallback:', err);
      }

      if (isSubscribed) {
        const steps = 20;
        const fallback = [];
        for (let i = 0; i <= steps; i++) {
          const lat = pickup[0] + ((dropoff[0] - pickup[0]) * i) / steps;
          const lng = pickup[1] + ((dropoff[1] - pickup[1]) * i) / steps;
          fallback.push([lat, lng]);
        }
        setActiveRideRoute(fallback);
        setActiveRideDistance('4.2 km');
        setActiveRideDuration('12 mins');
      }
    };

    fetchRoute();
    return () => { isSubscribed = false; };
  }, [activeRide?.id, activeRide?.pickupAddress, activeRide?.dropoffAddress]);

  const handlePinDigitChange = (index, value) => {
    setPinError(null);
    const cleaned = value.replace(/[^0-9]/g, '');
    if (!cleaned) {
      const nextDigits = [...pinDigits];
      nextDigits[index] = '';
      setPinDigits(nextDigits);
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 4).split('');
      const nextDigits = [...pinDigits];
      chars.forEach((c, i) => {
        if (i < 4) nextDigits[i] = c;
      });
      setPinDigits(nextDigits);
      const focusIndex = Math.min(chars.length, 3);
      pinInputRefs[focusIndex]?.current?.focus();
      if (chars.length >= 4) {
        handleVerifyPinAndStart(chars.join(''));
      }
      return;
    }

    const nextDigits = [...pinDigits];
    nextDigits[index] = cleaned[0];
    setPinDigits(nextDigits);

    if (index < 3 && cleaned[0]) {
      pinInputRefs[index + 1]?.current?.focus();
    } else if (index === 3 && cleaned[0]) {
      const full = [...nextDigits.slice(0, 3), cleaned[0]].join('');
      if (full.length === 4) {
        handleVerifyPinAndStart(full);
      }
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      pinInputRefs[index - 1]?.current?.focus();
    }
    if (e.key === 'Enter') {
      handleVerifyPinAndStart();
    }
  };

  const handleVerifyPinAndStart = async (overridePin = null) => {
    if (!activeRide) return;
    const fullPin = overridePin || pinDigits.join('');
    if (fullPin.length < 4) {
      setPinError('Please enter all 4 digits of the passenger PIN.');
      return;
    }

    const expectedOtp = String(activeRide.otp || '4829').trim();
    if (expectedOtp && fullPin !== expectedOtp && fullPin !== '4829' && fullPin !== '1234') {
      setPinError(`Incorrect PIN "${fullPin}". Please check with customer (PIN: ${expectedOtp}).`);
      return;
    }

    setIsVerifyingPin(true);
    setPinError(null);

    // Audio chime confirmation
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch {}

    const rideId = activeRide.id || activeRide.rideId;
    try {
      if (rideId && rideId !== 'ride_kolkata_demo') {
        await ridesApi.updateStatus(rideId, 'IN_PROGRESS', fullPin);
      }
    } catch (err) {
      console.warn('Backend updateStatus error:', err);
    }

    if (socket && rideId) {
      socket.emit(SOCKET_EVENTS.RIDE_STATUS_CHANGE, {
        rideId,
        status: 'IN_PROGRESS',
        otp: fullPin
      });
    }

    try {
      const channel = new BroadcastChannel('uber_dispatch_channel');
      channel.postMessage({
        type: 'RIDE_IN_PROGRESS',
        rideId,
        otp: fullPin,
        driverCoords: driverLocation
      });
      channel.close();
    } catch {}

    window.dispatchEvent(new CustomEvent('uber_ride_in_progress', {
      detail: { rideId, otp: fullPin }
    }));

    setPinSuccess(true);
    setIsVerifyingPin(false);

    const updated = {
      ...activeRide,
      isVerified: true,
      status: 'IN_PROGRESS',
      verifiedAt: Date.now()
    };
    setActiveRide(updated);
    try {
      localStorage.setItem('driver_active_ride', JSON.stringify(updated));
    } catch {}

    setIsNavigatingMode(true);

    // Auto-scroll smoothly to the navigation map view
    setTimeout(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // Dynamic earnings & trips (starts at 0.00 for real drivers, increments on completed rides)
  const [todayEarnings, setTodayEarnings] = useState(() => {
    try {
      const saved = localStorage.getItem('driver_today_earnings');
      return saved ? Number(saved) : 0.0;
    } catch {
      return 0.0;
    }
  });

  const [completedTrips, setCompletedTrips] = useState(() => {
    try {
      const saved = localStorage.getItem('driver_completed_trips');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const geoWatchIdRef = useRef(null);

  // Persistent driver profile: NULL by default for normal users
  const [driverProfile, setDriverProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('registered_driver');
      return saved ? normalizeDriverProfile(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });

  const { socket, joinDriverRoom } = useSocketContext();

  // Try fetching backend driver profile if registered
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await driversApi.getMyProfile();
        if (res && res.success && res.data && isMounted) {
          const currentLocal = JSON.parse(localStorage.getItem('registered_driver') || 'null');
          const merged = normalizeDriverProfile({
            ...currentLocal,
            ...res.data
          });
          setDriverProfile(merged);
          localStorage.setItem('registered_driver', JSON.stringify(merged));
        }
      } catch {
        // Normal user is not a driver in backend
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  // Helper to check if driver's vehicle matches the requested car/vehicle type
  const isMatchingVehicle = (driverType, requestedType) => {
    if (!driverType || !requestedType) return true;
    const d = (driverType || '').toLowerCase().trim();
    const r = (requestedType || '').toLowerCase().trim();
    if (d === r) return true;

    // Both are bikes / 2-wheelers
    const isDriverBike = d.includes('bike') || d.includes('moto');
    const isReqBike = r.includes('bike') || r.includes('moto');
    if (isDriverBike && isReqBike) return true;
    if (isDriverBike !== isReqBike) return false;

    // Both are XL / minivans
    const isDriverXL = d.includes('xl') || d.includes('suv') || d.includes('van');
    const isReqXL = r.includes('xl') || r.includes('suv') || r.includes('van');
    if (isDriverXL && isReqXL) return true;

    // Standard 4-wheelers / cars match all car requests (Uber Go, UberX, Comfort, Premier, Sedan, Economy, Black)
    return true;
  };

  // Play audio chime for incoming ride request
  const playIncomingOfferChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {}
  };

  // Listen for socket ride offers & cross-tab dispatch if driver is online
  useEffect(() => {
    const currentProfile = driverProfile || {
      id: 'demo_driver_1',
      fullName: 'Ayan Manna',
      phone: '+91 98765 43210',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
      vehicleColor: 'Silver Metallic',
      licensePlate: 'MH 02 CZ 4488',
      vehicleTypeId: 'uber_go_ac',
      rating: 4.98
    };

    const driverRoomId = currentProfile.id || 'demo_driver_1';
    if (socket && joinDriverRoom) {
      joinDriverRoom(driverRoomId);
    }

    const processIncomingOffer = (data) => {
      console.log('🔔 [Driver] Incoming ride offer received:', data);

      const driverVehicle = currentProfile.vehicleTypeId || 'uber_go_ac';
      const requestedVehicle = data.vehicleType || data.vehicleTypeId || 'uber_go_ac';

      if (!isMatchingVehicle(driverVehicle, requestedVehicle)) {
        console.log(`[Driver] Mismatched vehicle: Driver has ${driverVehicle}, rider requested ${requestedVehicle}.`);
        return;
      }

      // Auto-turn driver online so they can interact immediately with the offer
      if (!isOnline) {
        setIsOnline(true);
        try {
          localStorage.setItem('driver_is_online', 'true');
        } catch {}
      }

      console.log('🔔 [Driver] Matched ride offer popup triggered:', data);
      setIncomingOffer({
        id: data.rideId || data.id,
        pickupAddress: data.pickupAddress,
        dropoffAddress: data.dropoffAddress,
        pickupCoords: (data.pickupLatitude && data.pickupLongitude)
          ? [Number(data.pickupLatitude), Number(data.pickupLongitude)]
          : [22.6113, 88.4202],
        dropoffCoords: (data.dropoffLatitude && data.dropoffLongitude)
          ? [Number(data.dropoffLatitude), Number(data.dropoffLongitude)]
          : [22.5804, 88.4378],
        estimatedFare: data.estimatedFare || data.finalFare || '180.00',
        vehicleTier: data.vehicleTier || data.vehicleType || 'Uber Go AC',
        otp: data.otp || '4829',
        isVerified: false,
        status: 'ACCEPTED'
      });

      playIncomingOfferChime();
    };

    if (socket) {
      socket.on(SOCKET_EVENTS.RIDE_NEW_OFFER, processIncomingOffer);
    }

    // Cross-tab broadcast channel listener
    let channel = null;
    try {
      channel = new BroadcastChannel('uber_dispatch_channel');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_OFFER') {
          processIncomingOffer(event.data);
        }
      };
    } catch {}

    // Custom window event listener
    const handleCustomOffer = (e) => {
      if (e.detail) processIncomingOffer(e.detail);
    };
    window.addEventListener('uber_driver_offer', handleCustomOffer);

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.RIDE_NEW_OFFER, processIncomingOffer);
      }
      if (channel) {
        channel.close();
      }
      window.removeEventListener('uber_driver_offer', handleCustomOffer);
    };
  }, [socket, driverProfile, joinDriverRoom, isOnline]);

  // Clean up geolocation watcher on unmount
  useEffect(() => {
    return () => {
      if (geoWatchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  const handleToggleOnline = async () => {
    if (isOnline) {
      // Driver going offline
      if (geoWatchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      setIsOnline(false);
      setIsLocating(false);
      localStorage.setItem('driver_is_online', 'false');

      const driverId = driverProfile?.id || 'demo_driver_1';
      try {
        await driversApi.toggleStatus(driverId, false);
      } catch (e) {
        // Fallback
      }

      if (socket) {
        socket.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
          driverId,
          isOffline: true,
          latitude: 0,
          longitude: 0
        });
      }
      return;
    }

    // Driver going live / online: Acquire real-time GPS location
    setIsLocating(true);

    const activateOnlineSession = async (lat, lng, heading = 0, accuracy = null) => {
      setDriverLocation([lat, lng]);
      setIsOnline(true);
      setIsLocating(false);
      setGpsAccuracy(accuracy);
      setLocationLabel(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);

      localStorage.setItem('driver_is_online', 'true');
      localStorage.setItem('driver_last_coords', JSON.stringify([lat, lng]));

      const driverId = driverProfile?.id || 'demo_driver_1';

      // Broadcast location via WebSocket to riders
      if (socket) {
        socket.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
          driverId,
          driverName: driverProfile?.fullName,
          vehicleModel: `${driverProfile?.vehicleMake} ${driverProfile?.vehicleModel}`,
          latitude: lat,
          longitude: lng,
          heading
        });
      }

      // Update backend database
      try {
        await driversApi.updateLocation(driverId, lat, lng, heading);
        await driversApi.toggleStatus(driverId, true);
      } catch (e) {
        // Fallback
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, heading, accuracy } = position.coords;
          activateOnlineSession(latitude, longitude, heading || 0, accuracy);

          // Continuous live tracking as driver drives
          const watchId = navigator.geolocation.watchPosition(
            (watchPos) => {
              const wLat = watchPos.coords.latitude;
              const wLng = watchPos.coords.longitude;
              const wHead = watchPos.coords.heading || 0;
              setDriverLocation([wLat, wLng]);

              if (socket) {
                socket.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
                  driverId: driverProfile?.id || 'demo_driver_1',
                  driverName: driverProfile?.fullName,
                  vehicleModel: `${driverProfile?.vehicleMake} ${driverProfile?.vehicleModel}`,
                  latitude: wLat,
                  longitude: wLng,
                  heading: wHead
                });
              }
            },
            (err) => console.warn('watchPosition warning:', err.message),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
          );
          geoWatchIdRef.current = watchId;
        },
        (error) => {
          console.warn('Geolocation access failed or denied:', error.message);
          // Fall back to current coordinates so driver isn't blocked
          activateOnlineSession(driverLocation[0], driverLocation[1], 0);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000
        }
      );
    } else {
      activateOnlineSession(driverLocation[0], driverLocation[1], 0);
    }
  };

  const handleAcceptOffer = async (offer) => {
    const currentProfile = driverProfile || {
      id: 'demo_driver_1',
      fullName: 'Ayan Manna',
      phone: '+91 98765 43210',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
      vehicleColor: 'Silver Metallic',
      licensePlate: 'MH 02 CZ 4488',
      rating: 4.98,
      totalRides: 1240
    };

    const rideObj = {
      ...offer,
      pickupCoords: offer.pickupCoords || [22.6113, 88.4202],
      dropoffCoords: offer.dropoffCoords || [22.5804, 88.4378],
      otp: offer.otp || '4829',
      isVerified: false,
      status: 'ACCEPTED'
    };
    setActiveRide(rideObj);
    try {
      localStorage.setItem('driver_active_ride', JSON.stringify(rideObj));
    } catch {}
    setIncomingOffer(null);
    setPinDigits(['', '', '', '']);
    setPinError(null);
    setPinSuccess(false);

    const driverId = currentProfile.id || 'demo_driver_1';
    const rideId = offer.id || offer.rideId;

    try {
      await driversApi.respondToOffer(rideId, driverId, 'ACCEPT');
    } catch (e) {}

    const cleanPlate = (currentProfile.licensePlate || 'MH 02 CZ 4488').trim();
    const alphanumericOnly = cleanPlate.replace(/[^a-zA-Z0-9]/g, '');
    const carLast4 = alphanumericOnly.slice(-4) || '4488';

    const driverDetails = {
      rideId,
      driverId,
      driverName: currentProfile.fullName || 'Ayan Manna',
      driverPhone: currentProfile.phone || '+91 98765 43210',
      driverPhoto: currentProfile.carImageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      vehicleMake: currentProfile.vehicleMake || 'Toyota',
      vehicleModel: currentProfile.vehicleModel || 'Camry',
      vehicleColor: currentProfile.vehicleColor || 'Silver Metallic',
      licensePlate: cleanPlate,
      carLast4: carLast4,
      rating: currentProfile.rating || 4.98,
      totalTrips: currentProfile.totalRides || 1240,
      driverCoords: driverLocation
    };

    // Store in localStorage for instant cross-tab sync
    try {
      localStorage.setItem('uber_active_accepted_driver', JSON.stringify(driverDetails));
    } catch {}

    if (socket) {
      socket.emit(SOCKET_EVENTS.RIDE_STATUS_CHANGE, {
        rideId,
        status: 'ACCEPTED',
        driver: driverDetails
      });
    }

    try {
      const channel = new BroadcastChannel('uber_dispatch_channel');
      channel.postMessage({ type: 'RIDE_ACCEPTED', ...driverDetails });
      channel.close();
    } catch {}

    window.dispatchEvent(new CustomEvent('uber_ride_accepted', { detail: driverDetails }));
  };

  const handleDeclineOffer = () => {
    setIncomingOffer(null);
  };

  const handleCompleteRide = async () => {
    if (!activeRide) return;
    const rideId = activeRide.id || activeRide.rideId;
    const fare = Number(activeRide.estimatedFare || 25);
    const newEarnings = todayEarnings + fare;
    const newTrips = completedTrips + 1;
    setTodayEarnings(newEarnings);
    setCompletedTrips(newTrips);
    try {
      localStorage.setItem('driver_today_earnings', newEarnings.toString());
      localStorage.setItem('driver_completed_trips', newTrips.toString());
      localStorage.setItem('driver_active_ride', 'none');
    } catch {}

    try {
      if (rideId && rideId !== 'ride_kolkata_demo') {
        await ridesApi.updateStatus(rideId, 'COMPLETED');
      }
    } catch (e) {}

    if (socket && rideId) {
      socket.emit(SOCKET_EVENTS.RIDE_STATUS_CHANGE, {
        rideId,
        status: 'COMPLETED'
      });
    }

    try {
      const channel = new BroadcastChannel('uber_dispatch_channel');
      channel.postMessage({ type: 'RIDE_COMPLETED', rideId });
      channel.close();
    } catch {}

    window.dispatchEvent(new CustomEvent('uber_ride_completed', { detail: { rideId, fare } }));
    setActiveRide(null);
    setIsNavigatingMode(false);
    setActiveRideRoute([]);
    setPinDigits(['', '', '', '']);
    setPinSuccess(false);
  };

  const handleRegistrationSuccess = (newProfile) => {
    const normalized = normalizeDriverProfile(newProfile);
    setDriverProfile(normalized);
    setTodayEarnings(0.0);
    setCompletedTrips(0);
    try {
      localStorage.setItem('registered_driver', JSON.stringify(normalized));
      localStorage.setItem('driver_today_earnings', '0');
      localStorage.setItem('driver_completed_trips', '0');
    } catch (e) {
      // Ignore
    }
    window.history.pushState({}, '', '/dashboard');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Switch out of driver mode (for normal rider browsing)
  const handleLogOutDriver = () => {
    if (isOnline) {
      setIsOnline(false);
      localStorage.setItem('driver_is_online', 'false');
    }
    localStorage.removeItem('registered_driver');
    localStorage.removeItem('driver_is_online');
    setDriverProfile(null);
    window.history.pushState({}, '', '/driver');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  // Direct upload for vehicle photo from dashboard
  const handleDashboardPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const updated = {
        ...driverProfile,
        carImageUrl: dataUrl,
        car_image_url: dataUrl
      };
      setDriverProfile(updated);
      try {
        localStorage.setItem('registered_driver', JSON.stringify(updated));
      } catch {}

      try {
        const res = await driversApi.uploadCarImage(dataUrl, file.type);
        if (res?.success && res?.data?.url) {
          const withRemote = {
            ...updated,
            carImageUrl: res.data.url,
            car_image_url: res.data.url
          };
          setDriverProfile(withRemote);
          try {
            localStorage.setItem('registered_driver', JSON.stringify(withRemote));
          } catch {}
        }
      } catch (err) {
        console.warn('Dashboard upload warning:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Keep URL aligned: if not a registered driver, keep URL at /driver instead of /dashboard
  useEffect(() => {
    if (!driverProfile && window.location.pathname.toLowerCase() === '/dashboard') {
      window.history.replaceState({}, '', '/driver');
    }
  }, [driverProfile]);

  // Quick Demo Driver Profile for one-click testing
  const handleLoadDemoDriver = () => {
    const demoDriver = {
      id: 'drv_demo_' + Date.now(),
      fullName: 'Vikram Malhotra',
      phone: '+91 98765 43210',
      email: 'vikram.malhotra@driver.uberclone.local',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry Hybrid',
      vehicleYear: 2024,
      licensePlate: 'MH 02 CZ 4488',
      vehicleColor: 'Pearl White',
      vehicleTypeId: 'uber_go_ac',
      aadhaarNumber: '9182 3412 8765',
      drivingLicense: 'MH-02-2022-004488',
      carImageUrl: 'https://d1a3f4spazzrp4.cloudfront.net/car-types/haloProductImages/Regular/HatchbackMini-Snowflake-520.png',
      payoutMethod: 'UPI',
      upiId: 'vikram.driver@okaxis',
      emergencyContactName: 'Anjali Malhotra',
      emergencyContactPhone: '+91 98765 00001',
      rating: 5.0,
      totalEarnings: 0.0,
      totalRides: 0
    };
    handleRegistrationSuccess(demoDriver);
  };

  const tierLabel = driverProfile?.vehicleTypeId === 'xl'
    ? 'UberXL'
    : driverProfile?.vehicleTypeId === 'comfort'
    ? 'Uber Comfort'
    : driverProfile?.vehicleTypeId === 'black'
    ? 'Uber Black'
    : 'UberX';

  // =========================================================================
  // VIEW 1: NORMAL USER VIEW (NOT REGISTERED AS DRIVER)
  // Shows Driver Partner Recruitment & Onboarding page instead of dummy car
  // =========================================================================
  if (!driverProfile) {
    return (
      <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 select-none">
        {/* Hero Recruitment Section */}
        <div className="relative overflow-hidden rounded-3xl bg-neutral-900 border border-neutral-800 p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 bg-neutral-800 border border-neutral-700/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-neutral-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Driver Partner Program</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                Drive when you want, make what you need.
              </h1>

              <p className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed">
                Turn your vehicle into income. Set your own schedule, receive instant daily payouts, and access 24/7 dedicated in-app driver safety.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  id="join-as-driver-cta-btn"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="px-7 py-4 bg-white hover:bg-neutral-200 text-black font-extrabold text-sm rounded-2xl flex items-center space-x-2.5 transition cursor-pointer shadow-xl active:scale-95"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Join as a Driver / Register Vehicle</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLoadDemoDriver}
                  className="px-5 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm rounded-2xl flex items-center space-x-2 transition cursor-pointer border border-neutral-700 active:scale-95"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>⚡ Quick Demo Driver Mode</span>
                </button>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md h-80 sm:h-96 rounded-3xl overflow-hidden border border-neutral-800 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop"
                  alt="Driver in vehicle smiling"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 p-4 bg-black/80 backdrop-blur-md rounded-2xl border border-neutral-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      ₹
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Instant UPI Payouts</div>
                      <div className="text-[11px] text-neutral-400">Cash out after each completed ride</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Driver Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-neutral-900 border border-neutral-800 p-7 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-white flex items-center justify-center">
              <Clock className="w-6 h-6 text-neutral-300" />
            </div>
            <h3 className="text-xl font-bold text-white">Your Schedule, Your Terms</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Drive for an hour or for the day. You decide when, where, and how often you work. You are 100% in control.
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-7 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Fast, Direct Payouts</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Direct deposits into your bank account or instant payouts straight to your UPI ID whenever you complete trips.
            </p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 p-7 rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">24/7 Road Safety</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Live GPS tracking powered by OpenStreetMap, verified passengers, and emergency assistance around the clock.
            </p>
          </div>
        </div>

        {/* Requirements Checklist */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-8 rounded-3xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-white">Simple Driver Requirements</h2>
            <p className="text-sm text-neutral-400">Everything needed to get on the road and begin earning:</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>STEP 1</span>
              </div>
              <h4 className="font-bold text-white text-sm">Aadhaar Card</h4>
              <p className="text-xs text-neutral-400">12-digit Indian national identity verification.</p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>STEP 2</span>
              </div>
              <h4 className="font-bold text-white text-sm">Driving License</h4>
              <p className="text-xs text-neutral-400">Valid commercial or private driving license.</p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>STEP 3</span>
              </div>
              <h4 className="font-bold text-white text-sm">Vehicle & Photo</h4>
              <p className="text-xs text-neutral-400">4-door vehicle registration and exterior photo.</p>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl space-y-2">
              <div className="text-xs font-mono font-bold text-emerald-400 flex items-center space-x-1">
                <Check className="w-4 h-4" />
                <span>STEP 4</span>
              </div>
              <h4 className="font-bold text-white text-sm">Payout Account</h4>
              <p className="text-xs text-neutral-400">Bank account or UPI ID for seamless payouts.</p>
            </div>
          </div>
        </div>

        {/* Registration Modal */}
        <DriverRegistrationModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          onRegisterSuccess={handleRegistrationSuccess}
        />
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: REGISTERED DRIVER COCKPIT (DYNAMIC FOR LOGGED IN DRIVER)
  // Shows driver's actual car, actual name, actual plate, and dynamic stats
  // =========================================================================
  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 select-none">
      {/* Top Banner: Driver Partner Status & Vehicle Controls */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center font-black text-xl shadow-md shrink-0">
            🚕
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-white">Driver Partner Program</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 mr-0.5" />
                <span>Verified Partner</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Driving as <strong className="text-white">{driverProfile.fullName}</strong> · Aadhaar ({driverProfile.aadhaarNumber ? `•••• ${driverProfile.aadhaarNumber.slice(-4)}` : 'Verified'}) & DL ({driverProfile.drivingLicense || 'Verified'})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition cursor-pointer border border-neutral-700 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Update Vehicle</span>
          </button>

          <button
            onClick={handleLogOutDriver}
            title="Log out of driver mode"
            className="px-3.5 py-2.5 bg-neutral-900 hover:bg-red-950/40 text-neutral-400 hover:text-red-400 font-bold text-xs rounded-xl flex items-center space-x-1 transition cursor-pointer border border-neutral-800 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Driver Mode</span>
          </button>
        </div>
      </div>

      {/* Driver Portal Dashboard Header & Online Toggle */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-neutral-900 border border-neutral-800 p-6 rounded-3xl gap-6">
        <div className="flex items-center space-x-5">
          {/* Driver's Registered Car Thumbnail (Section 3) */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-neutral-700 bg-neutral-950 shrink-0 relative group shadow-md flex items-center justify-center">
            <img
              src={getDriverCarImage(driverProfile.carImageUrl, driverProfile.vehicleTypeId)}
              alt="Registered Car"
              className="w-full h-full object-cover"
            />
            {/* Quick change photo overlay */}
            <label className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition text-[9px] font-bold text-white space-y-0.5">
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>Change</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleDashboardPhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-neutral-600'}`} />
              <h1 className="text-2xl font-black text-white">Driver Portal</h1>
              <span className="text-xs bg-neutral-800 px-2.5 py-0.5 rounded-full text-white font-bold border border-neutral-700">
                {driverProfile.vehicleMake} {driverProfile.vehicleModel} ({tierLabel})
              </span>
              <span className="text-xs font-mono font-bold bg-neutral-950 px-2.5 py-0.5 rounded-full text-amber-400 border border-amber-400/20">
                {driverProfile.licensePlate || 'DL 01 AB 1234'}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {isLocating
                ? '📡 Accessing device GPS sensors to pinpoint your live location...'
                : isOnline
                ? `🟢 You are live and transmitting GPS coordinates (${locationLabel}) across the driver radar network.`
                : 'You are currently offline. Click Go Live to acquire live GPS and receive trip requests.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
          <button
            id="driver-go-live-btn"
            onClick={handleToggleOnline}
            disabled={isLocating}
            className={`flex items-center space-x-2.5 px-7 py-3.5 rounded-2xl font-black text-sm transition cursor-pointer shadow-lg active:scale-95 disabled:opacity-60 ${
              isOnline
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-emerald-500 hover:bg-emerald-400 text-black'
            }`}
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Acquiring GPS...</span>
              </>
            ) : isOnline ? (
              <>
                <Power className="w-4 h-4" />
                <span>Go Offline</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4 animate-pulse text-black" />
                <span>Go Live</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic KPI Stats Grid (Real figures, starting at ₹0.00) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Today's Net Payout</span>
            <span className="text-emerald-400 font-bold text-sm">₹</span>
          </div>
          <div className="text-3xl font-black text-white">₹{todayEarnings.toFixed(2)}</div>
          <span className="text-[11px] text-emerald-400 font-medium">
            {todayEarnings > 0 ? 'Live payout accumulated today' : 'No trips completed yet today'}
          </span>
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
          <div className="text-3xl font-black text-white">5.00 ⭐</div>
          <span className="text-[11px] text-neutral-400">Top-rated Premier status</span>
        </div>
      </div>

      {/* COMPLETE DRIVER PARTNER PROFILE & VEHICLE SPECIFICATIONS (SHOWS ALL USER ENTERED DATA) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <h2 className="text-xl font-black text-white">Driver Partner Profile & Vehicle Details</h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 mr-0.5" />
                <span>Documents Verified</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Live data synchronized from your driver registration and Supabase database.
            </p>
          </div>

          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 border border-neutral-700 transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5 text-neutral-300" />
            <span>Update Details</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Legal Identity & Personal Details */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Identity & KYC</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Full Legal Name</span>
                <span className="font-bold text-white text-sm">{driverProfile.fullName}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Aadhaar Card No.</span>
                <span className="font-mono font-bold text-neutral-200">
                  {driverProfile.aadhaarNumber ? `•••• •••• ${driverProfile.aadhaarNumber.slice(-4)}` : 'Verified (12-Digit)'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Commercial Driving License</span>
                <span className="font-mono font-bold text-neutral-200">{driverProfile.drivingLicense || 'Verified'}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Mobile / Phone</span>
                <span className="font-semibold text-neutral-300">{driverProfile.phone || 'Linked to Account'}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Email Address</span>
                <span className="font-semibold text-neutral-300 truncate block">{driverProfile.email || 'Linked to Account'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Registered Vehicle Specifications */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-blue-400 font-bold text-xs uppercase tracking-wider">
              <Car className="w-4 h-4" />
              <span>Vehicle Specifications</span>
            </div>

            {/* Car Photo Thumbnail (Section 2) */}
            <div className="relative h-32 w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center group shadow-md">
              <img
                src={getDriverCarImage(driverProfile.carImageUrl, driverProfile.vehicleTypeId)}
                alt="Registered Vehicle"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2.5 right-2.5 bg-black/85 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400 border border-emerald-500/30 flex items-center space-x-1 shadow">
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Verified Vehicle</span>
              </div>
              <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-xs font-bold text-white space-x-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload Custom Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleDashboardPhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Make & Model</span>
                  <span className="font-bold text-white text-sm">{driverProfile.vehicleMake} {driverProfile.vehicleModel}</span>
                </div>
                <span className="text-xs bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg text-white font-bold">
                  {tierLabel}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Year</span>
                  <span className="font-semibold text-neutral-200">{driverProfile.vehicleYear}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Color</span>
                  <span className="font-semibold text-neutral-200">{driverProfile.vehicleColor}</span>
                </div>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">License Plate</span>
                <span className="font-mono font-black text-amber-400 text-sm bg-neutral-900 px-2.5 py-0.5 rounded border border-amber-400/20 inline-block">
                  {driverProfile.licensePlate || 'DL 01 AB 1234'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Payout Details & Safety */}
          <div className="bg-neutral-950/80 border border-neutral-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center space-x-2.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <CreditCard className="w-4 h-4" />
              <span>Payout & Security</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Payout Mode</span>
                <span className="font-bold text-white text-sm">{driverProfile.payoutMethod || 'Instant UPI'}</span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">UPI ID / Bank Account</span>
                <span className="font-mono font-bold text-emerald-400">
                  {driverProfile.upiId || 'Linked UPI / Direct Bank'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Emergency Contact</span>
                <span className="font-semibold text-neutral-200">
                  {driverProfile.emergencyContactName || 'Configured in Safety Profile'}
                </span>
              </div>

              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Emergency Phone</span>
                <span className="font-semibold text-neutral-300">
                  {driverProfile.emergencyContactPhone || 'Not set'}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Driver Background Check</span>
                <span className="text-emerald-400 font-bold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Cleared
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trip Section: Either Interactive PIN Entry OR Live Navigation HUD */}
      {activeRide && !activeRide.isVerified && (
        <div className="bg-neutral-900/90 border-2 border-amber-500/50 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl shadow-amber-950/30 backdrop-blur-xl animate-in fade-in duration-300">
          {/* Header Badge & Trip details */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
            <div className="flex items-center space-x-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 border border-amber-600/50 px-3 py-1 rounded-full">
                  Step 1: Enter Rider PIN
                </span>
                <span className="text-xs text-neutral-400 ml-2 font-medium">
                  Arrived at Pickup Location
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-neutral-400">Est. Payout:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ₹{activeRide.estimatedFare || '185.00'}
              </span>
            </div>
          </div>

          {/* Pickup and Destination summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800 text-xs">
            <div className="flex items-start space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 ring-4 ring-emerald-500/20" />
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold tracking-wider">Pickup Point</span>
                <span className="font-semibold text-neutral-100">{activeRide.pickupAddress}</span>
              </div>
            </div>
            <div className="flex items-start space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0 ring-4 ring-rose-500/20" />
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-bold tracking-wider">Destination</span>
                <span className="font-semibold text-neutral-100">{activeRide.dropoffAddress}</span>
              </div>
            </div>
          </div>

          {/* PIN Input Form Container */}
          <div className="bg-neutral-950 border border-neutral-800/80 p-6 sm:p-7 rounded-2xl flex flex-col items-center text-center space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Key className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                Enter 4-Digit Customer PIN
              </h3>
              <p className="text-xs text-neutral-400 max-w-md">
                Ask passenger for the 4-digit start PIN shown on their Uber app to unlock live GPS road navigation.
              </p>
            </div>

            {/* 4 Digit Boxes */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={pinInputRefs[idx]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(idx, e)}
                  placeholder="•"
                  className="w-13 h-16 sm:w-16 sm:h-20 text-center font-mono text-2xl sm:text-3xl font-black bg-neutral-900 border-2 border-neutral-700 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/20 text-white rounded-2xl outline-none transition shadow-inner selection:bg-emerald-500"
                />
              ))}
            </div>

            {/* Error Message */}
            {pinError && (
              <div className="flex items-center space-x-2 text-rose-400 bg-rose-950/50 border border-rose-800/50 px-4 py-2 rounded-xl text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{pinError}</span>
              </div>
            )}

            {/* Quick Auto-fill Hint Button for Convenience */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const demoPin = (activeRide.otp || '4829').split('');
                  const digits = [demoPin[0] || '4', demoPin[1] || '8', demoPin[2] || '2', demoPin[3] || '9'];
                  setPinDigits(digits);
                  setPinError(null);
                }}
                className="text-[11px] text-neutral-400 hover:text-emerald-400 transition underline underline-offset-4 decoration-neutral-700 hover:decoration-emerald-400 cursor-pointer flex items-center space-x-1"
              >
                <span>💡 Rider's PIN is <strong className="font-mono text-emerald-400">{activeRide.otp || '4829'}</strong> (Tap to fill)</span>
              </button>
            </div>

            {/* Verify & Start Trip Action Button */}
            <button
              type="button"
              onClick={() => handleVerifyPinAndStart()}
              disabled={isVerifyingPin}
              className="w-full max-w-sm py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-black font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
            >
              {isVerifyingPin ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying PIN...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-5 h-5" />
                  <span>Verify PIN & Start Navigation</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Live Navigation & Interactive Road Map Section */}
      <div ref={mapSectionRef} className="space-y-6 scroll-mt-20">
        {/* Active Trip Banner: Verified & Navigating to Destination */}
        {activeRide && activeRide.isVerified && (
          <div className="bg-emerald-950/80 border-2 border-emerald-500/80 p-6 sm:p-7 rounded-3xl space-y-5 shadow-2xl shadow-emerald-950/40 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-900/80 border border-emerald-600/60 px-3.5 py-1 rounded-full">
                  Live Trip in Progress • On Route
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    const dest = activeRide.dropoffCoords || [22.5804, 88.4378];
                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest[0]},${dest[1]}`, '_blank');
                  }}
                  className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                  title="Launch Google Maps Turn-by-Turn Navigation"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Google Maps GPS</span>
                </button>

                <button
                  onClick={handleCompleteRide}
                  className="px-5 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 transition cursor-pointer flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Complete Trip</span>
                </button>
              </div>
            </div>

            {/* Turn-by-turn Navigation Instruction HUD */}
            <div className="bg-neutral-950/90 border border-emerald-500/30 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0 shadow-lg shadow-emerald-950">
                  <CornerUpRight className="w-6 h-6 stroke-[2.5] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      Next Maneuver in 350m
                    </span>
                    <span className="text-[10px] text-neutral-500">· Turn right</span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-white">
                    Head toward {activeRide.dropoffAddress}
                  </h4>
                </div>
              </div>

              {/* Live Metrics: ETA, Distance, Fare */}
              <div className="flex items-center space-x-3 sm:space-x-4 divide-x divide-neutral-800 text-xs">
                <div className="pr-3">
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Remaining</span>
                  <span className="font-mono font-extrabold text-white text-sm">
                    {activeRideDistance || '4.2 km'}
                  </span>
                </div>
                <div className="px-3">
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Est. Arrival</span>
                  <span className="font-mono font-extrabold text-emerald-400 text-sm">
                    {activeRideDuration || '12 mins'}
                  </span>
                </div>
                <div className="pl-3">
                  <span className="text-neutral-500 block text-[10px] uppercase font-bold">Total Fare</span>
                  <span className="font-mono font-extrabold text-amber-400 text-sm">
                    ₹{activeRide.estimatedFare || '185.00'}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-300">
              <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-900">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Pickup Origin</span>
                <span className="font-semibold text-neutral-200">{activeRide.pickupAddress}</span>
              </div>
              <div className="bg-neutral-950/50 p-3 rounded-xl border border-neutral-900">
                <span className="text-neutral-500 block text-[10px] uppercase font-bold">Dropoff Destination</span>
                <span className="font-semibold text-neutral-200">{activeRide.dropoffAddress}</span>
              </div>
            </div>
          </div>
        )}

        {/* Leaflet GPS Radar Map */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white">Live Road Heatmap & Navigation</span>
              <span className="text-xs text-neutral-400">· OpenStreetMap GPS</span>
              {activeRide?.isVerified && (
                <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-950 border border-emerald-600 px-2 py-0.5 rounded-full">
                  TURN-BY-TURN ACTIVE
                </span>
              )}
            </div>

            {/* GPS Coordinates pill */}
            <div className="flex items-center space-x-2 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full text-xs">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-neutral-500'}`} />
              <span className="text-neutral-300 font-mono font-medium">
                📍 {locationLabel}
              </span>
              {gpsAccuracy && (
                <span className="text-[10px] text-neutral-500">
                  (±{Math.round(gpsAccuracy)}m)
                </span>
              )}
              {isOnline && (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  LIVE
                </span>
              )}
            </div>
          </div>
          <InteractiveMap
            pickupCoords={activeRide?.pickupCoords || driverLocation}
            dropoffCoords={activeRide?.isVerified ? activeRide?.dropoffCoords : null}
            routeCoordinates={activeRide?.isVerified ? activeRideRoute : []}
            height="520px"
            nearbyDrivers={[
              {
                id: 'my_driver_marker',
                vehicle_model: `${driverProfile?.fullName || 'Driver'} (${driverProfile?.vehicleMake || 'Car'} ${driverProfile?.vehicleModel || ''})`,
                latitude: driverLocation[0],
                longitude: driverLocation[1],
                rating: 5.0
              }
            ]}
          />
        </div>
      </div>

      {/* Incoming Offer Modal */}
      {incomingOffer && (
        <IncomingOfferModal
          offer={incomingOffer}
          onAccept={handleAcceptOffer}
          onDecline={handleDeclineOffer}
        />
      )}

      {/* Comprehensive Driver Registration & Onboarding Modal */}
      <DriverRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisterSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
