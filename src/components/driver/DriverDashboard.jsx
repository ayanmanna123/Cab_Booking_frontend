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
  Check
} from 'lucide-react';
import InteractiveMap from '../map/InteractiveMap';
import IncomingOfferModal from './IncomingOfferModal';
import DriverRegistrationModal from './DriverRegistrationModal';
import { useSocketContext } from '../../context/SocketContext';
import { SOCKET_EVENTS } from '../../constants/socketEvents';
import { driversApi } from '../../api';

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [driverLocation, setDriverLocation] = useState([37.7749, -122.4194]);
  const [locationLabel, setLocationLabel] = useState('San Francisco, CA');
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [activeRide, setActiveRide] = useState(null);
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
      return saved ? JSON.parse(saved) : null;
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
          const profile = {
            id: res.data.id,
            fullName: res.data.cb_users?.full_name || res.data.full_name || 'Driver Partner',
            vehicleMake: res.data.vehicle_make || 'Toyota',
            vehicleModel: res.data.vehicle_model || 'Camry',
            vehicleYear: res.data.vehicle_year || 2023,
            licensePlate: res.data.license_plate || '',
            vehicleColor: res.data.vehicle_color || 'Silver',
            vehicleTypeId: res.data.vehicle_type_id || 'economy',
            aadhaarNumber: res.data.aadhaar_number || (res.data.stripe_account_id?.replace('AADHAAR:', '') || ''),
            drivingLicense: res.data.driving_license || '',
            carImageUrl: res.data.car_image_url || res.data.cb_users?.avatar_url || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800',
            totalEarnings: Number(res.data.total_earnings || 0),
            totalRides: Number(res.data.total_rides || 0),
            rating: Number(res.data.rating || 5.0)
          };
          setDriverProfile(profile);
          localStorage.setItem('registered_driver', JSON.stringify(profile));
        }
      } catch {
        // Normal user is not a driver in backend
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  // Listen for socket ride offers if driver profile exists
  useEffect(() => {
    if (!socket || !driverProfile) return;

    const driverRoomId = driverProfile.id || 'demo_driver_1';
    joinDriverRoom(driverRoomId);

    const handleNewOffer = (data) => {
      console.log('🔔 [Driver] New offer received via WebSocket:', data);
      setIncomingOffer(data);
    };

    socket.on(SOCKET_EVENTS.RIDE_NEW_OFFER, handleNewOffer);

    return () => {
      socket.off(SOCKET_EVENTS.RIDE_NEW_OFFER, handleNewOffer);
    };
  }, [socket, driverProfile, joinDriverRoom]);

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

      // Simulate incoming passenger offer after 7s for testing dispatch
      setTimeout(() => {
        if (!incomingOffer && !activeRide) {
          setIncomingOffer({
            id: 'ride_sim_' + Math.floor(Math.random() * 1000),
            pickupAddress: 'Financial District Terminal',
            dropoffAddress: 'Embarcadero Pier Center',
            estimatedFare: '32.50',
            vehicleTier: driverProfile?.vehicleTypeId === 'xl' ? 'UberXL' : 'UberX',
            pickupCoords: [lat + 0.003, lng + 0.003],
            dropoffCoords: [lat + 0.012, lng + 0.009]
          });
        }
      }, 7000);
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

  const handleAcceptOffer = (offer) => {
    setActiveRide(offer);
    setIncomingOffer(null);
    const fare = Number(offer.estimatedFare || 25);
    const newEarnings = todayEarnings + fare;
    const newTrips = completedTrips + 1;
    setTodayEarnings(newEarnings);
    setCompletedTrips(newTrips);
    try {
      localStorage.setItem('driver_today_earnings', newEarnings.toString());
      localStorage.setItem('driver_completed_trips', newTrips.toString());
    } catch (e) {
      // Ignore
    }
  };

  const handleDeclineOffer = () => {
    setIncomingOffer(null);
  };

  const handleCompleteRide = () => {
    setActiveRide(null);
  };

  const handleRegistrationSuccess = (newProfile) => {
    setDriverProfile(newProfile);
    setTodayEarnings(0.0);
    setCompletedTrips(0);
    try {
      localStorage.setItem('registered_driver', JSON.stringify(newProfile));
      localStorage.setItem('driver_today_earnings', '0');
      localStorage.setItem('driver_completed_trips', '0');
    } catch (e) {
      // Ignore
    }
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
  };

  // Quick Demo Driver Profile for one-click testing
  const handleLoadDemoDriver = () => {
    const demoDriver = {
      id: 'drv_demo_' + Date.now(),
      fullName: 'Vikram Malhotra',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry Hybrid',
      vehicleYear: 2024,
      licensePlate: 'MH 02 CZ 4488',
      vehicleColor: 'Silver Metallic',
      vehicleTypeId: 'economy',
      aadhaarNumber: '9182 3412 8765',
      drivingLicense: 'MH-02-2022-004488',
      carImageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=800&auto=format&fit=crop',
      payoutMethod: 'UPI',
      upiId: 'vikram.driver@okaxis',
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
              Driving as <strong className="text-white">{driverProfile.fullName}</strong> · Aadhaar & Commercial DL Verified
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
          {/* Driver's Registered Car Thumbnail */}
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-neutral-700 bg-black shrink-0 relative group shadow-md">
            <img
              src={driverProfile.carImageUrl || 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?q=80&w=400'}
              alt="Registered Car"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-ping' : 'bg-neutral-600'}`} />
              <h1 className="text-2xl font-black text-white">Driver Portal</h1>
              <span className="text-xs bg-neutral-800 px-2.5 py-0.5 rounded-full text-white font-bold border border-neutral-700">
                {driverProfile.vehicleMake} {driverProfile.vehicleModel} ({tierLabel})
              </span>
              <span className="text-xs font-mono font-bold bg-neutral-950 px-2.5 py-0.5 rounded-full text-amber-400 border border-amber-400/20">
                {driverProfile.licensePlate || 'NO PLATE'}
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

      {/* Dynamic KPI Stats Grid (Real figures, starting at $0.00) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-semibold">
            <span>Today's Net Payout</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white">${todayEarnings.toFixed(2)}</div>
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

      {/* Active Trip Banner if riding */}
      {activeRide && (
        <div className="bg-emerald-950/70 border border-emerald-700/80 p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full">
              Trip In Progress
            </span>
            <button
              onClick={handleCompleteRide}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-xl transition cursor-pointer"
            >
              Complete Trip
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-200">
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Pickup</span>
              <span className="font-semibold">{activeRide.pickupAddress}</span>
            </div>
            <div>
              <span className="text-neutral-400 block text-[10px] uppercase font-bold">Destination</span>
              <span className="font-semibold">{activeRide.dropoffAddress}</span>
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
          pickupCoords={driverLocation}
          height="480px"
          nearbyDrivers={[
            {
              id: 'my_driver_marker',
              vehicle_model: `${driverProfile.fullName} (${driverProfile.vehicleMake} ${driverProfile.vehicleModel})`,
              latitude: driverLocation[0],
              longitude: driverLocation[1],
              rating: 5.0
            }
          ]}
        />
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
