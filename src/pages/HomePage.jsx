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
    }).catch(() => {});
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
                vehicle_model: `${d.vehicle_make || 'Uber'} ${d.vehicle_model || 'Driver'}`,
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
        } catch {}

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
          } catch {}
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
              vehicle_model: data.vehicleModel || 'Uber Driver',
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
      {/* 1. Hero Section: Official Uber Go Anywhere Layout */}
      <section id="ride" className="relative py-8 lg:py-12 bg-black">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          {/* Header Row: City Selector & Main Headline */}
          <div className="mb-6 lg:mb-8">
            <div className="flex items-center space-x-2 text-xs font-medium text-neutral-300 mb-3">
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
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-black tracking-[-0.03em] leading-[1.05] text-white">
              Go anywhere
            </h1>
          </div>

          {/* Perfectly Aligned Two-Column Grid: Details (Left) & Map (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Left Column: Details Section / Ride Booking Widget */}
            <div className="lg:col-span-5 flex justify-center lg:justify-start z-10 w-full">
              <RideBookingWidget
                onRouteCalculated={handleRouteCalculated}
                hideHeadline={true}
              />
            </div>

            {/* Right Column: Live Map / Visuals - Aligned with Left Details Section */}
            <div className="lg:col-span-7 flex justify-center w-full">
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

      {/* 2. Explore what you can do with Uber (6-card official grid) */}
      <SuggestionsRow />

      {/* 3. Plan ahead cards, Earn with Uber (light theme), and Business section */}
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
