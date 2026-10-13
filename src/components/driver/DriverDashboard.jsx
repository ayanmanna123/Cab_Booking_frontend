import React, { useState, useEffect, useRef } from 'react';
import {
  Power,
  DollarSign,
  TrendingUp,
  MapPin,
  Navigation,
  Shield,
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
  Star,
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
import { useUser, SignInButton } from '@clerk/clerk-react';
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
      const isOnlineSaved = localStorage.getItem('driver_is_online') === 'true';
      const saved = localStorage.getItem('driver_active_ride');
      if (isOnlineSaved && saved && saved !== 'none') {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(parsed.status)) {
          return parsed;
        }
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
  const leftCardRef = useRef(null);
  const [syncedMapHeight, setSyncedMapHeight] = useState('440px');
  const pinInput0Ref = useRef(null);
  const pinInput1Ref = useRef(null);
  const pinInput2Ref = useRef(null);
  const pinInput3Ref = useRef(null);
  const pinInputRefs = [pinInput0Ref, pinInput1Ref, pinInput2Ref, pinInput3Ref];

  // Synchronize map height exactly with left details card so both columns have matching heights
  useEffect(() => {
    if (!leftCardRef.current) return;
    const updateSize = () => {
      if (leftCardRef.current && window.innerWidth >= 1024) {
        const leftH = leftCardRef.current.offsetHeight;
        if (leftH > 200) {
          // Account for the bottom telemetry status line (approx 26px = 16px text + mt-2)
          setSyncedMapHeight(`${Math.max(380, leftH - 26)}px`);
        }
      } else {
        setSyncedMapHeight('380px');
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(leftCardRef.current);
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [activeRide?.status, activeRide?.isVerified, isOnline, pinDigits, pinError]);

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

  const handleArriveAtPickup = async () => {
    if (!activeRide) return;
    const rideId = activeRide.id || activeRide.rideId;
    try {
      await ridesApi.arriveRide(rideId);
    } catch (err) {
      console.warn('Backend arriveRide error:', err);
    }

    const updated = {
      ...activeRide,
      status: 'ARRIVED'
    };
    setActiveRide(updated);
    try {
      localStorage.setItem('driver_active_ride', JSON.stringify(updated));
    } catch {}

    if (socket && rideId) {
      socket.emit(SOCKET_EVENTS.RIDE_STATUS_CHANGE, {
        rideId,
        status: 'ARRIVED'
      });
    }

    try {
      const channel = new BroadcastChannel('uber_dispatch_channel');
      channel.postMessage({ type: 'RIDE_ARRIVED', rideId });
      channel.close();
    } catch {}

    window.dispatchEvent(new CustomEvent('uber_ride_arrived', { detail: { rideId } }));
  };

  const handleVerifyPinAndStart = async (overridePin = null) => {
    if (!activeRide) return;
    const fullPin = overridePin || pinDigits.join('');
    if (fullPin.length < 4) {
      setPinError('Please enter all 4 digits of the passenger PIN.');
      return;
    }

    setIsVerifyingPin(true);
    setPinError(null);

    const rideId = activeRide.id || activeRide.rideId;
    try {
      // Backend authoritative PIN verification
      const res = await ridesApi.verifyPin(rideId, fullPin);
      if (res && res.success) {
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

        if (socket && rideId) {
          socket.emit(SOCKET_EVENTS.RIDE_STATUS_CHANGE, {
            rideId,
            status: 'IN_PROGRESS'
          });
        }

        try {
          const channel = new BroadcastChannel('uber_dispatch_channel');
          channel.postMessage({
            type: 'RIDE_IN_PROGRESS',
            rideId,
            driverCoords: driverLocation
          });
          channel.close();
        } catch {}

        window.dispatchEvent(new CustomEvent('uber_ride_in_progress', {
          detail: { rideId }
        }));

        setIsNavigatingMode(true);

        // Auto-scroll smoothly to the navigation map view
        setTimeout(() => {
          mapSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
    } catch (err) {
      setPinError(err.message || 'Incorrect PIN. Please ask the passenger for the 4-digit ride verification PIN.');
      setIsVerifyingPin(false);
    }
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
      if (saved) {
        const parsed = JSON.parse(saved);
        // Purge legacy demo driver if present
        if (
          parsed?.id?.startsWith('drv_demo_') ||
          parsed?.id === 'demo_driver_1' ||
          parsed?.email?.includes('driver.uberclone.local') ||
          parsed?.fullName === 'Vikram Malhotra'
        ) {
          localStorage.removeItem('registered_driver');
          return null;
        }
        return normalizeDriverProfile(parsed);
      }
      return null;
    } catch {
      return null;
    }
  });

  const { isSignedIn, user, isLoaded } = useUser();
  const { socket, joinDriverRoom } = useSocketContext();

  // Clean out legacy demo driver if stored in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('registered_driver');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed?.id?.startsWith('drv_demo_') ||
          parsed?.id === 'demo_driver_1' ||
          parsed?.email?.includes('driver.uberclone.local') ||
          parsed?.fullName === 'Vikram Malhotra'
        ) {
          localStorage.removeItem('registered_driver');
          setDriverProfile(null);
        }
      }
    } catch {}
  }, []);

  // When signed out of Clerk, ensure offline status and reset session
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      if (isOnline) {
        setIsOnline(false);
        localStorage.setItem('driver_is_online', 'false');
      }
    }
  }, [isLoaded, isSignedIn, isOnline]);

  // Try fetching backend driver profile if registered and signed in
  useEffect(() => {
    let isMounted = true;
    if (!isSignedIn || !user) return;

    const fetchProfile = async () => {
      try {
        const res = await driversApi.getMyProfile();
        if (res && res.success && res.data && isMounted) {
          const currentLocal = JSON.parse(localStorage.getItem('registered_driver') || 'null');
          const merged = normalizeDriverProfile({
            ...currentLocal,
            ...res.data,
            fullName: res.data.fullName || res.data.full_name || user.fullName || currentLocal?.fullName,
            email: res.data.email || user.primaryEmailAddress?.emailAddress || currentLocal?.email,
            phone: res.data.phone || user.primaryPhoneNumber?.phoneNumber || currentLocal?.phone
          });
          setDriverProfile(merged);
          localStorage.setItem('registered_driver', JSON.stringify(merged));
        }
      } catch {
        // Normal user is not a driver in backend yet
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [isSignedIn, user?.id]);

  // Restore active ride on mount if driver reloads the browser
  useEffect(() => {
    let isMounted = true;
    const restoreActiveRide = async () => {
      try {
        const isOnlineSaved = localStorage.getItem('driver_is_online') === 'true';
        if (!isOnlineSaved) {
          if (isMounted) {
            setActiveRide(null);
            localStorage.removeItem('driver_active_ride');
          }
          return;
        }

        const res = await ridesApi.getActiveRide();
        if (res && res.success && res.data && isMounted) {
          const r = res.data;
          if (['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(r.status)) {
            const normalized = {
              id: r.id,
              rideId: r.id,
              pickupAddress: r.pickup_address,
              dropoffAddress: r.dropoff_address,
              pickupCoords: [Number(r.pickup_latitude), Number(r.pickup_longitude)],
              dropoffCoords: [Number(r.dropoff_latitude), Number(r.dropoff_longitude)],
              estimatedFare: r.estimated_fare,
              vehicleTier: r.vehicle_type?.name || r.vehicle_type_id || 'Uber Go',
              status: r.status,
              riderName: r.rider?.full_name || 'Passenger',
              riderPhone: r.rider?.phone || '+91 98765 00000',
              isVerified: r.status === 'IN_PROGRESS' || r.status === 'COMPLETED'
            };
            setActiveRide(normalized);
            if (normalized.status === 'IN_PROGRESS') {
              setIsNavigatingMode(true);
            }
          } else {
            setActiveRide(null);
            localStorage.removeItem('driver_active_ride');
          }
        } else if (isMounted) {
          setActiveRide(null);
          localStorage.removeItem('driver_active_ride');
        }
      } catch {
        // No active ride or not logged in as driver
        if (isMounted) {
          setActiveRide(null);
          localStorage.removeItem('driver_active_ride');
        }
      }
    };
    restoreActiveRide();
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
        isVerified: false,
        status: 'SEARCHING'
      });

      playIncomingOfferChime();
    };

    const handleRideUnavailable = (data) => {
      console.log('🚫 [Driver] Ride taken by another driver or cancelled:', data);
      const targetId = data?.rideId || data?.id;
      setIncomingOffer((prev) => {
        if (!prev) return null;
        const offerId = prev.id || prev.rideId;
        if (offerId === targetId) {
          return null;
        }
        return prev;
      });
    };

    if (socket) {
      socket.on(SOCKET_EVENTS.RIDE_NEW_OFFER, processIncomingOffer);
      socket.on(SOCKET_EVENTS.RIDE_UNAVAILABLE, handleRideUnavailable);
    }

    // Cross-tab broadcast channel listener
    let channel = null;
    try {
      channel = new BroadcastChannel('uber_dispatch_channel');
      channel.onmessage = (event) => {
        if (event.data) {
          if (event.data.type === 'NEW_OFFER') {
            processIncomingOffer(event.data);
          } else if (event.data.type === 'RIDE_UNAVAILABLE' || event.data.type === 'RIDE_ACCEPTED') {
            handleRideUnavailable(event.data);
          }
        }
      };
    } catch {}

    // Custom window event listener
    const handleCustomOffer = (e) => {
      if (e.detail) processIncomingOffer(e.detail);
    };
    const handleCustomUnavailable = (e) => {
      if (e.detail) handleRideUnavailable(e.detail);
    };
    window.addEventListener('uber_driver_offer', handleCustomOffer);
    window.addEventListener('uber_ride_unavailable', handleCustomUnavailable);

    return () => {
      if (socket) {
        socket.off(SOCKET_EVENTS.RIDE_NEW_OFFER, processIncomingOffer);
        socket.off(SOCKET_EVENTS.RIDE_UNAVAILABLE, handleRideUnavailable);
      }
      if (channel) {
        channel.close();
      }
      window.removeEventListener('uber_driver_offer', handleCustomOffer);
      window.removeEventListener('uber_ride_unavailable', handleCustomUnavailable);
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
    if (!isSignedIn) {
      alert('Please sign in to your driver account before going live.');
      return;
    }

    if (!driverProfile) {
      setIsRegisterModalOpen(true);
      return;
    }

    if (isOnline) {
      // Driver going offline
      if (geoWatchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      setIsOnline(false);
      setIsLocating(false);
      setActiveRide(null);
      localStorage.setItem('driver_is_online', 'false');
      localStorage.removeItem('driver_active_ride');

      const driverId = driverProfile?.id || user?.id || 'registered_driver';
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

      const driverId = driverProfile?.id || user?.id || 'registered_driver';

      // Broadcast location via WebSocket to riders
      if (socket) {
        socket.emit(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, {
          driverId,
          driverName: driverProfile?.fullName || user?.fullName || 'Driver Partner',
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
                  driverId: driverProfile?.id || user?.id || 'registered_driver',
                  driverName: driverProfile?.fullName || user?.fullName || 'Driver Partner',
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
      id: user?.id || 'registered_driver',
      fullName: user?.fullName || 'Driver Partner',
      phone: user?.primaryPhoneNumber?.phoneNumber || '+91 98765 43210',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
      vehicleColor: 'Silver Metallic',
      licensePlate: 'MH 02 CZ 4488',
      rating: 5.0,
      totalRides: 0
    };

    const rideId = offer.id || offer.rideId;
    const driverId = currentProfile.id || user?.id || 'registered_driver';

    const cleanPlate = (currentProfile.licensePlate || 'MH 02 CZ 4488').trim();
    const alphanumericOnly = cleanPlate.replace(/[^a-zA-Z0-9]/g, '');
    const carLast4 = alphanumericOnly.slice(-4) || '4488';

    const driverDetails = {
      rideId,
      driverId,
      driverName: currentProfile.fullName || 'Vikram Malhotra',
      driverPhone: currentProfile.phone || '+91 98765 43210',
      driverPhoto: currentProfile.carImageUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
      driverUpiId: (
        currentProfile.upiId ||
        currentProfile.upi_id ||
        localStorage.getItem('driver_registered_upi') ||
        (localStorage.getItem('driver_custom_upi') && localStorage.getItem('driver_custom_upi') !== 'vikram.cab@okhdfcbank' ? localStorage.getItem('driver_custom_upi') : null) ||
        ''
      ),
      vehicleMake: currentProfile.vehicleMake || 'Toyota',
      vehicleModel: currentProfile.vehicleModel || 'Camry',
      vehicleColor: currentProfile.vehicleColor || 'Silver Metallic',
      licensePlate: cleanPlate,
      carLast4,
      rating: currentProfile.rating || 4.98,
      totalTrips: currentProfile.totalRides || 1240,
      driverCoords: driverLocation
    };

    // Immediate optimistic update so driver view updates instantly!
    const rideObj = {
      ...offer,
      id: rideId,
      rideId,
      pickupCoords: offer.pickupCoords || [22.6113, 88.4202],
      dropoffCoords: offer.dropoffCoords || [22.5804, 88.4378],
      status: 'ACCEPTED',
      isVerified: false
    };

    setActiveRide(rideObj);
    try {
      localStorage.setItem('driver_active_ride', JSON.stringify(rideObj));
      localStorage.setItem('uber_active_accepted_driver', JSON.stringify(driverDetails));
    } catch {}

    setIncomingOffer(null);
    setPinDigits(['', '', '', '']);
    setPinError(null);
    setPinSuccess(false);
    setIsNavigatingMode(true);

    // Broadcast acceptance via WebSockets and BroadcastChannel
    if (socket) {
      socket.emit(SOCKET_EVENTS.RIDE_STATUS_CHANGE, {
        rideId,
        status: 'ACCEPTED',
        driver: driverDetails
      });
      socket.emit('ride:status_change', {
        rideId,
        status: 'ACCEPTED',
        driver: driverDetails
      });
      socket.emit('ride:accept', driverDetails);
    }

    try {
      localStorage.setItem('uber_active_accepted_driver', JSON.stringify({ ...driverDetails, _ts: Date.now() }));
    } catch {}

    try {
      const channel = new BroadcastChannel('uber_dispatch_channel');
      channel.postMessage({ type: 'RIDE_ACCEPTED', rideId, ...driverDetails });
      // Keep channel alive briefly so message is dispatched to other tabs
      setTimeout(() => {
        try { channel.close(); } catch {}
      }, 1000);
    } catch {}

    window.dispatchEvent(new CustomEvent('uber_ride_accepted', { detail: driverDetails }));

    try {
      // Backend authoritative acceptance
      const res = await ridesApi.acceptRide(rideId);
      if (res?.data) {
        const merged = { ...rideObj, ...res.data, status: 'ACCEPTED' };
        setActiveRide(merged);
        try {
          localStorage.setItem('driver_active_ride', JSON.stringify(merged));
        } catch {}
      }
    } catch (err) {
      console.warn('Backend acceptRide notice:', err.message);
    }
  };

  const handleDeclineOffer = async (offer) => {
    const rideId = offer?.id || offer?.rideId;
    if (rideId) {
      try {
        await ridesApi.rejectRide(rideId);
      } catch {}
    }
    setIncomingOffer(null);
  };

  const handleCompleteRide = async () => {
    if (!activeRide) return;
    const rideId = activeRide.id || activeRide.rideId;
    let earnedAmount = Number(activeRide.estimatedFare || 25);

    try {
      const res = await ridesApi.completeRide(rideId);
      if (res && res.success && res.data) {
        earnedAmount = Number(res.data.driverEarnings || res.data.final_fare || earnedAmount);
      }
    } catch (e) {
      console.warn('Backend completeRide error:', e);
    }

    const newEarnings = todayEarnings + earnedAmount;
    const newTrips = completedTrips + 1;
    setTodayEarnings(newEarnings);
    setCompletedTrips(newTrips);
    try {
      localStorage.setItem('driver_today_earnings', newEarnings.toString());
      localStorage.setItem('driver_completed_trips', newTrips.toString());
      localStorage.setItem('driver_active_ride', 'none');
    } catch {}

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

    window.dispatchEvent(new CustomEvent('uber_ride_completed', { detail: { rideId, fare: earnedAmount } }));
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
              {isSignedIn ? (
                <>
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-300 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Signed in as <strong className="text-white">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</strong></span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                    Register your vehicle to go live.
                  </h1>

                  <p className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed">
                    Complete your driver partner registration with your vehicle details and documents. Once registered, unlock your driver cockpit and click Go Live to receive trips.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <button
                      id="join-as-driver-cta-btn"
                      onClick={() => setIsRegisterModalOpen(true)}
                      className="px-7 py-4 bg-white hover:bg-neutral-200 text-black font-extrabold text-sm rounded-2xl flex items-center space-x-2.5 transition cursor-pointer shadow-xl active:scale-95"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span>Register Vehicle & Go Live</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-neutral-800/80 border border-neutral-700 text-neutral-300 text-xs font-medium">
                    <Shield className="w-4 h-4 text-white" />
                    <span>Driver Account Authentication Required</span>
                  </div>

                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1]">
                    Drive when you want, make what you need.
                  </h1>

                  <p className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed">
                    Turn your vehicle into income. Set your own schedule, receive instant daily payouts, and access 24/7 dedicated in-app driver safety.
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <SignInButton mode="modal">
                      <button
                        id="driver-sign-in-btn"
                        className="px-7 py-4 bg-white hover:bg-neutral-200 text-black font-extrabold text-sm rounded-2xl flex items-center space-x-2.5 transition cursor-pointer shadow-xl active:scale-95"
                      >
                        <User className="w-5 h-5" />
                        <span>Sign In as Driver</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </SignInButton>

                    <SignInButton mode="modal">
                      <button
                        id="join-as-driver-cta-btn"
                        className="px-6 py-4 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm rounded-2xl flex items-center space-x-2 transition cursor-pointer border border-neutral-700 active:scale-95"
                      >
                        <UserPlus className="w-5 h-5 text-neutral-300" />
                        <span>Register as a Driver</span>
                      </button>
                    </SignInButton>
                  </div>
                </>
              )}
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
  // Minimalist, modern, compact, and premium two-column live ride dashboard
  // =========================================================================
  return (
    <div className="py-4 sm:py-6 max-w-[1200px] mx-auto px-4 sm:px-6 space-y-4 select-none">
      {/* 1. Slim Top Bar: Driver Partner Status & Vehicle Controls */}
      <div className="bg-neutral-950 border border-neutral-800 p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold text-sm shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-semibold text-white truncate">Driver Partner Program</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
              Driving as <strong className="text-white font-medium">{driverProfile.fullName}</strong> · Aadhaar ({driverProfile.aadhaarNumber ? `•••• ${driverProfile.aadhaarNumber.slice(-4)}` : 'Verified'}) & DL ({driverProfile.drivingLicense || 'Verified'})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="h-8 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-medium text-xs rounded-lg flex items-center space-x-1.5 transition cursor-pointer border border-neutral-800 active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Update Vehicle</span>
          </button>

          <button
            type="button"
            onClick={handleLogOutDriver}
            title="Log out of driver mode"
            className="h-8 px-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white font-medium text-xs rounded-lg flex items-center space-x-1 transition cursor-pointer border border-neutral-800 active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Driver Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Driver Portal Status & Quick KPI Row */}
      <div className="bg-neutral-950 border border-neutral-800 p-3.5 sm:p-4 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 shadow-md">
        <div className="flex items-center space-x-3.5 min-w-0">
          {/* Driver's Car Avatar Thumbnail */}
          <div className="w-11 h-11 rounded-full overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0 relative group shadow-sm flex items-center justify-center">
            <img
              src={getDriverCarImage(driverProfile.carImageUrl, driverProfile.vehicleTypeId)}
              alt="Registered Car"
              className="w-full h-full object-cover"
            />
            <label className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition text-[9px] font-semibold text-white">
              <Camera className="w-3.5 h-3.5 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleDashboardPhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-white animate-pulse' : 'bg-neutral-600'}`} />
              <h1 className="text-sm font-semibold text-white tracking-tight">Driver Portal</h1>
            </div>
            <p className="text-[11px] text-neutral-400 truncate max-w-lg mt-0.5">
              {isLocating
                ? 'Acquiring GPS coordinates...'
                : isOnline
                ? `Live and transmitting GPS coordinates (${locationLabel}) across radar.`
                : 'Offline. Click Go Live to acquire GPS and receive passenger ride requests.'}
            </p>
          </div>
        </div>

        {/* Compact KPI Metrics & Go Live Action Button */}
        <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center divide-x divide-neutral-800 px-2 py-1 bg-black border border-neutral-800 rounded-xl text-xs">
            <div className="px-3 text-center">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Today's Payout</span>
              <span className="font-mono font-bold text-white text-xs sm:text-sm">₹{todayEarnings.toFixed(2)}</span>
            </div>
            <div className="px-3 text-center">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Trips</span>
              <span className="font-mono font-bold text-white text-xs sm:text-sm">{completedTrips}</span>
            </div>
            <div className="px-3 text-center">
              <span className="text-[10px] uppercase font-semibold text-neutral-500 block">Score</span>
              <span className="font-bold text-white text-xs sm:text-sm flex items-center justify-center space-x-1">
                <span>5.00</span>
                <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline" />
              </span>
            </div>
          </div>

          <button
            type="button"
            id="driver-go-live-btn"
            onClick={handleToggleOnline}
            disabled={isLocating}
            className={`h-9 px-4 rounded-lg font-semibold text-xs transition cursor-pointer shadow-sm active:scale-95 disabled:opacity-60 flex items-center space-x-1.5 shrink-0 ${
              isOnline
                ? 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {isLocating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Acquiring GPS...</span>
              </>
            ) : isOnline ? (
              <>
                <Power className="w-3.5 h-3.5 text-red-400" />
                <span>Go Offline</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-black" />
                <span>Go Live</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3. Responsive Two-Column Live Ride-Tracking & Map Dashboard (~38% Left, ~62% Right) */}
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
        {/* Left Column: Ride Details / Driver Card (~38% width) */}
        <div ref={leftCardRef} className="w-full lg:w-[38%] shrink-0">
          {isOnline && activeRide && ['ACCEPTED', 'ARRIVED', 'IN_PROGRESS'].includes(activeRide.status) ? (
            /* Active Trip Assigned (ACCEPTED, ARRIVED, or IN_PROGRESS) */
            <div className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl select-none">
              {/* Slim Ride Status Bar */}
              <div className="pb-3 border-b border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-white shrink-0 animate-pulse" />
                    <span className="text-xs font-semibold text-white tracking-tight">
                      {activeRide.status === 'IN_PROGRESS'
                        ? 'Trip in progress'
                        : activeRide.status === 'ARRIVED'
                        ? 'Driver arrived at pickup'
                        : 'Driver en route to pickup'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                    {activeRide.status === 'IN_PROGRESS'
                      ? 'Navigating'
                      : activeRide.status === 'ARRIVED'
                      ? 'At Pickup'
                      : 'On Route'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 pl-4">
                  {activeRide.status === 'IN_PROGRESS'
                    ? `Heading toward destination: ${activeRide.dropoffAddress || 'Destination'}`
                    : activeRide.status === 'ARRIVED'
                    ? 'Waiting for passenger at pickup location. Verify PIN to begin.'
                    : `Approaching pickup: ${activeRide.pickupAddress || 'Pickup Point'}`}
                </p>
              </div>

              {/* Minimal Passenger Info Row */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/80">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0 flex items-center justify-center text-white font-bold text-sm">
                    <User className="w-5 h-5 text-neutral-300" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">
                      {activeRide.riderName || 'Passenger Partner'}
                    </h4>
                    <div className="flex items-center space-x-1.5 text-xs text-neutral-400 mt-0.5">
                      <span className="text-neutral-200 font-medium flex items-center space-x-1">
                        <span>5.0</span>
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline" />
                      </span>
                      <span>•</span>
                      <span>Verified Rider</span>
                    </div>
                  </div>
                </div>

                {/* Small Phone-call Icon Button (36px) */}
                <a
                  href={`tel:${activeRide.riderPhone || '+919876543210'}`}
                  className="w-9 h-9 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-sm"
                  title="Call Passenger"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Vehicle / Ride Fare: Compact Two-Column Layout */}
              <div className="space-y-2 pb-3 border-b border-neutral-800/80">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 block">
                      Ride Tier
                    </span>
                    <span className="font-semibold text-white">
                      {tierLabel}
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      {driverProfile.vehicleMake} {driverProfile.vehicleModel}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 block">
                      Est. Payout
                    </span>
                    <span className="font-mono text-xs font-bold text-white bg-black border border-neutral-800 px-2.5 py-1 rounded-md inline-block mt-0.5">
                      ₹{activeRide.estimatedFare || '185.00'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>Verify passenger identity before starting the trip.</span>
                </div>
              </div>

              {/* Compact Ride Verification PIN (ARRIVED state) */}
              {activeRide.status === 'ARRIVED' && !activeRide.isVerified && (
                <div className="space-y-2.5 pb-3 border-b border-neutral-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Ride verification PIN
                      </span>
                      <span className="text-[11px] text-neutral-400 block">
                        Ask passenger for the 4-digit PIN
                      </span>
                    </div>

                    {/* 4 Digit Boxes */}
                    <div className="flex items-center space-x-1">
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
                          className="w-7 h-8 text-center font-mono text-sm font-bold bg-black border border-neutral-800 focus:border-white text-white rounded-md outline-none transition"
                        />
                      ))}
                    </div>
                  </div>

                  {pinError && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-red-400 bg-red-950/40 border border-red-900/50 px-2.5 py-1.5 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{pinError}</span>
                    </div>
                  )}

                  <div className="flex items-center space-x-1.5 text-[10px] text-neutral-500">
                    <Shield className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span>Never start trip before passenger is safely seated.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleVerifyPinAndStart()}
                    disabled={isVerifyingPin}
                    className="w-full h-9 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isVerifyingPin ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying PIN...</span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Verify PIN & Start Trip</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Status Action Buttons for ACCEPTED */}
              {activeRide.status === 'ACCEPTED' && (
                <div className="space-y-2 pb-3 border-b border-neutral-800/80 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const pickup = activeRide.pickupCoords || [22.6113, 88.4202];
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${pickup[0]},${pickup[1]}`, '_blank');
                      }}
                      className="h-9 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Google Maps</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleArriveAtPickup}
                      className="h-9 px-3 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>I've Arrived</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Status Action Buttons for IN_PROGRESS */}
              {activeRide.status === 'IN_PROGRESS' && (
                <div className="space-y-2 pb-3 border-b border-neutral-800/80 pt-1">
                  <div className="flex items-center justify-between text-xs py-1">
                    <span className="text-neutral-400">Remaining</span>
                    <span className="font-mono font-bold text-white text-xs">{activeRideDistance || '4.2 km'} · {activeRideDuration || '12 mins'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const dest = activeRide.dropoffCoords || [22.5804, 88.4378];
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest[0]},${dest[1]}`, '_blank');
                      }}
                      className="h-9 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>GPS Maps</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCompleteRide}
                      className="h-9 px-3 bg-white hover:bg-neutral-200 text-black font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Trip</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Trip Route Details */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start space-x-2 truncate">
                  <div className="w-1.5 h-1.5 rounded-full bg-white mt-1.5 shrink-0" />
                  <span className="text-neutral-300 truncate text-[11px]">
                    {activeRide.pickupAddress || 'Pickup Point'}
                  </span>
                </div>
                <div className="flex items-start space-x-2 truncate">
                  <MapPin className="w-3 h-3 text-neutral-400 mt-0.5 shrink-0" />
                  <span className="text-neutral-400 truncate text-[11px]">
                    {activeRide.dropoffAddress || 'Destination Point'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Standby / Waiting for Rides State (Driver is Online or Offline) */
            <div className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xl select-none">
              {/* Slim Standby Status Bar */}
              <div className="pb-3 border-b border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-white animate-pulse' : 'bg-neutral-600'}`} />
                    <span className="text-xs font-semibold text-white tracking-tight">
                      {isOnline ? 'Active on driver radar' : 'Driver currently offline'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-300 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                    {isOnline ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 pl-4">
                  {isOnline
                    ? 'Transmitting GPS to nearby riders. Trip requests will appear here.'
                    : 'Click Go Live to connect your vehicle to the passenger network.'}
                </p>
              </div>

              {/* Minimal Driver & Vehicle Card */}
              <div className="space-y-3 pb-3 border-b border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-11 h-11 rounded-full overflow-hidden border border-neutral-800 bg-neutral-900 shrink-0">
                      <img
                        src={getDriverCarImage(driverProfile.carImageUrl, driverProfile.vehicleTypeId)}
                        alt="Vehicle"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {driverProfile.fullName}
                      </h4>
                      <div className="flex items-center space-x-1.5 text-xs text-neutral-400 mt-0.5">
                        <span className="text-neutral-200 font-medium flex items-center space-x-1">
                          <span>5.0</span>
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 inline" />
                        </span>
                        <span>•</span>
                        <span>{driverProfile.totalRides || 1240}+ trips</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(true)}
                    className="w-9 h-9 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95 shadow-sm"
                    title="Vehicle Settings"
                  >
                    <Car className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Two-Column Vehicle Details */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 block">
                      Vehicle
                    </span>
                    <span className="font-semibold text-white">
                      {driverProfile.vehicleMake} {driverProfile.vehicleModel}
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      {driverProfile.vehicleColor} · {driverProfile.vehicleYear}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500 block">
                      License Plate
                    </span>
                    <span className="font-mono text-xs font-bold text-white bg-black border border-neutral-800 px-2.5 py-1 rounded-md inline-block mt-0.5">
                      {driverProfile.licensePlate || 'DL 01 AB 1234'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-[11px] text-neutral-500 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span>Aadhaar, Commercial License, & KYC Verified.</span>
                </div>
              </div>

              {/* Standby Summary Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Payout UPI ID</span>
                  <span className="font-mono text-xs text-neutral-200 font-medium">
                    {driverProfile.upiId || 'Linked to Account'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
                  <span className="text-neutral-400">Today's Accumulated</span>
                  <span className="font-mono font-bold text-white text-sm">
                    ₹{todayEarnings.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="w-full h-8 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white font-medium text-xs rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Update Vehicle & Payout Details</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live GPS Radar Map (~62% width) */}
        <div className="w-full lg:w-[62%] flex-1 min-w-0">
          <div className="relative w-full rounded-[18px] overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950">
            {/* Map GPS Coordinates Overlay (Top Left) */}
            <div className="absolute top-3 left-3 z-20 bg-neutral-950/80 border border-neutral-800 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center space-x-1.5 text-xs text-neutral-300 shadow-lg">
              <MapPin className="w-3 h-3 text-white" />
              <span className="font-mono text-[11px] font-medium">{locationLabel}</span>
              {gpsAccuracy && (
                <span className="text-[10px] text-neutral-500">
                  (±{Math.round(gpsAccuracy)}m)
                </span>
              )}
            </div>

            <InteractiveMap
              pickupCoords={activeRide?.pickupCoords || driverLocation}
              dropoffCoords={activeRide?.isVerified ? activeRide?.dropoffCoords : null}
              routeCoordinates={activeRide?.isVerified ? activeRideRoute : []}
              height={syncedMapHeight}
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

          <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 px-1 shrink-0">
            <span>
              {isOnline
                ? 'Transmitting live GPS telemetry to passenger network'
                : 'Driver offline · Go Live to begin GPS beacon'}
            </span>
            <span className="text-neutral-500">Scroll wheel or + / − to zoom</span>
          </div>
        </div>
      </div>

      {/* 4. Compact Driver Partner Profile & Vehicle Specifications Grid */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Driver Partner Profile & Vehicle Details</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Verified legal identity, specifications, and instant payout channels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="h-7 px-2.5 bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-[11px] rounded-md border border-neutral-800 transition cursor-pointer flex items-center space-x-1"
          >
            <UserPlus className="w-3 h-3" />
            <span>Update Details</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Card 1: Identity & KYC */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center space-x-2 text-white font-semibold text-[11px] uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Identity & KYC</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Full Legal Name</span>
                <span className="font-semibold text-white">{driverProfile.fullName}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Aadhaar Card No.</span>
                <span className="font-mono text-neutral-300">
                  {driverProfile.aadhaarNumber ? `•••• •••• ${driverProfile.aadhaarNumber.slice(-4)}` : 'Verified (12-Digit)'}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Commercial License</span>
                <span className="font-mono text-neutral-300">{driverProfile.drivingLicense || 'Verified'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Vehicle Specifications */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center space-x-2 text-white font-semibold text-[11px] uppercase tracking-wider">
              <Car className="w-3.5 h-3.5" />
              <span>Vehicle Specifications</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Make & Model</span>
                  <span className="font-semibold text-white">{driverProfile.vehicleMake} {driverProfile.vehicleModel}</span>
                </div>
                <span className="font-mono text-xs font-bold text-white bg-black border border-neutral-800 px-2 py-0.5 rounded">
                  {driverProfile.licensePlate || 'DL 01 AB 1234'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Year</span>
                  <span className="text-neutral-300">{driverProfile.vehicleYear}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Color</span>
                  <span className="text-neutral-300">{driverProfile.vehicleColor}</span>
                </div>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Tier Category</span>
                <span className="text-neutral-300">{tierLabel}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Payout & Security */}
          <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex items-center space-x-2 text-white font-semibold text-[11px] uppercase tracking-wider">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payout & Security</span>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">Payout Channel</span>
                <span className="font-semibold text-white">{driverProfile.payoutMethod || 'Instant UPI'}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px] uppercase font-semibold">UPI ID / Account</span>
                <span className="font-mono text-neutral-300 truncate block">
                  {driverProfile.upiId || 'Linked UPI / Direct Bank'}
                </span>
              </div>
              <div className="pt-1 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
                <span>Background Check</span>
                <span className="text-white font-semibold flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Cleared
                </span>
              </div>
            </div>
          </div>
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

      {/* Driver Registration & Onboarding Modal */}
      <DriverRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegisterSuccess={handleRegistrationSuccess}
      />
    </div>
  );
}
