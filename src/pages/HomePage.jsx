import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import RideBookingWidget from '../components/booking/RideBookingWidget';
import HeroVisual from '../components/home/HeroVisual';
import SuggestionsRow from '../components/home/SuggestionsRow';
import FeaturesShowcase from '../components/home/FeaturesShowcase';
import DriverEarningsCalculator from '../components/home/DriverEarningsCalculator';
import SafetySection from '../components/home/SafetySection';
import AppDownloadBanner from '../components/home/AppDownloadBanner';
import { driversApi, ridesApi } from '../api';
import { useSocketContext } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../constants/socketEvents';

export default function HomePage() {
  const [city, setCity] = useState('San Francisco, CA');
  const [pickupCoords, setPickupCoords] = useState([22.6113, 88.4202]);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [hasActiveRoute, setHasActiveRoute] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  const { socket } = useSocketContext();

  // Sync active ride pickup and dropoff coords so route line is drawn immediately on active ride
  useEffect(() => {
    let isMounted = true;
    ridesApi.getActiveRide().then((res) => {
      if (res?.success && res.data && isMounted) {
        const r = res.data;
        const pLat = Number(r.pickup_latitude);
        const pLng = Number(r.pickup_longitude);
        const dLat = Number(r.dropoff_latitude);
        const dLng = Number(r.dropoff_longitude);
        if (pLat && pLng) setPickupCoords([pLat, pLng]);
        if (dLat && dLng) {
          setDropoffCoords([dLat, dLng]);
          setHasActiveRoute(true);
        }
      }
    }).catch(() => { });
    return () => { isMounted = false; };
  }, []);

  // Fetch real online drivers from backend & sync local live driver
  useEffect(() => {
    let isMounted = true;

    const fetchDrivers = async () => {
      try {
        const res = await driversApi.getNearbyDrivers(pickupCoords[0], pickupCoords[1]);
        const formatted = [];

        if (res && res.data && Array.isArray(res.data)) {
          res.data.forEach((d) => {
            if (d && (d.latitude || d.current_latitude)) {
              formatted.push({
                id: d.id,
                vehicle_model: `${d.vehicle_make || 'Veyro'} ${d.vehicle_model || 'Driver'}`,
                type: (d.vehicle_type_id || '').toLowerCase().includes('bike') ? 'bike' : 'car',
                latitude: Number(d.current_latitude || d.latitude),
                longitude: Number(d.current_longitude || d.longitude),
                rating: Number(d.rating || 5.0),
                heading: Number(d.heading || 0)
              });
            }
          });
        }

        // Merge local driver ONLY if currently marked online in this browser
        try {
          const isOnline = localStorage.getItem('driver_is_online') === 'true';
          const saved = JSON.parse(localStorage.getItem('registered_driver') || 'null');
          if (isOnline && saved) {
            const coords = JSON.parse(localStorage.getItem('driver_last_coords') || 'null') || pickupCoords;
            // Prevent duplicate if already in formatted
            if (!formatted.some((d) => d.id === 'my_live_driver' || d.id === saved.id)) {
              formatted.push({
                id: saved.id || 'my_live_driver',
                vehicle_model: `${saved.fullName} (${saved.vehicleMake} ${saved.vehicleModel})`,
                type: (saved.vehicleTypeId || '').toLowerCase().includes('bike') ? 'bike' : 'car',
                latitude: coords[0],
                longitude: coords[1],
                rating: Number(saved.rating || 5.0),
                heading: 0
              });
            }
          }
        } catch { }

        if (isMounted) {
          setNearbyDrivers(formatted);
        }
      } catch (err) {
        if (isMounted) {
          // Check local driver if online even if network error
          try {
            const isOnline = localStorage.getItem('driver_is_online') === 'true';
            const saved = JSON.parse(localStorage.getItem('registered_driver') || 'null');
            if (isOnline && saved) {
              const coords = JSON.parse(localStorage.getItem('driver_last_coords') || 'null') || pickupCoords;
              setNearbyDrivers([{
                id: saved.id || 'my_live_driver',
                vehicle_model: `${saved.fullName} (${saved.vehicleMake} ${saved.vehicleModel})`,
                type: (saved.vehicleTypeId || '').toLowerCase().includes('bike') ? 'bike' : 'car',
                latitude: coords[0],
                longitude: coords[1],
                rating: Number(saved.rating || 5.0),
                heading: 0
              }]);
              return;
            }
          } catch { }
          setNearbyDrivers([]);
        }
      }
    };

    fetchDrivers();

    return () => {
      isMounted = false;
    };
  }, [pickupCoords]);

  // Listen to live driver location updates over WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleLocationUpdate = (data) => {
      if (!data || !data.driverId) return;

      if (data.isOffline) {
        // Remove driver if they went offline
        setNearbyDrivers((prev) => prev.filter((d) => d.id !== data.driverId));
        return;
      }

      setNearbyDrivers((prev) => {
        const existingIdx = prev.findIndex((d) => d.id === data.driverId);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            latitude: data.latitude,
            longitude: data.longitude,
            heading: data.heading || 0,
            vehicle_model: data.vehicleModel || updated[existingIdx].vehicle_model
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: data.driverId,
              vehicle_model: data.vehicleModel || 'Veyro Driver',
              latitude: data.latitude,
              longitude: data.longitude,
              heading: data.heading || 0,
              rating: 5.0
            }
          ];
        }
      });
    };

    socket.on(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, handleLocationUpdate);

    return () => {
      socket.off(SOCKET_EVENTS.DRIVER_LOCATION_UPDATE, handleLocationUpdate);
    };
  }, [socket]);

  const handleRouteCalculated = ({ pickup, dropoff, coordinates }) => {
    setPickupCoords(pickup);
    setDropoffCoords(dropoff);
    setRouteCoordinates(coordinates);
    setHasActiveRoute(true);
  };

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section: Minimalist & Compact Live Ride-Tracking Layout */}
      <section id="ride" className="relative py-4 sm:py-6 lg:py-8 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Row: City Selector & Main Headline */}
          <div className="mb-4 lg:mb-5">
            <div className="flex items-center space-x-2 text-xs font-medium text-neutral-400 mb-2">
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-medium">{city}</span>
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
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-tight text-white">
              Go anywhere
            </h1>
          </div>

          {/* Responsive Two-Column Layout: Details (40% desktop) & Map (60% desktop) */}
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
            {/* Left Column: Details Section / Ride Booking Widget */}
            <div className="w-full lg:w-[40%] shrink-0 z-10">
              <RideBookingWidget
                onRouteCalculated={handleRouteCalculated}
                hideHeadline={true}
              />
            </div>

            {/* Right Column: Live Map / Visuals */}
            <div className="w-full lg:w-[60%] flex-1 min-w-0">
              <HeroVisual
                pickupCoords={pickupCoords}
                dropoffCoords={dropoffCoords}
                routeCoordinates={routeCoordinates}
                nearbyDrivers={nearbyDrivers}
                hasActiveRoute={hasActiveRoute}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Explore what you can do with Veyro (6-card official grid) */}
      <SuggestionsRow />

      {/* 3. Plan ahead cards, Earn with Veyro (light theme), and Business section */}
      <FeaturesShowcase />

      {/* 4. Driver Earnings Interactive Calculator */}
      <DriverEarningsCalculator />

      {/* 5. Rider Safety & Emergency SOS */}
      <SafetySection />

      {/* 6. Official "It's easier in the apps" QR Code Banner */}
      <AppDownloadBanner />
    </div>
  );
}
