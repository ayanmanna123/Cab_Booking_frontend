import React, { useState, useEffect } from 'react';
import RideBookingWidget from '../components/booking/RideBookingWidget';
import HeroVisual from '../components/home/HeroVisual';
import SuggestionsRow from '../components/home/SuggestionsRow';
import FeaturesShowcase from '../components/home/FeaturesShowcase';
import DriverEarningsCalculator from '../components/home/DriverEarningsCalculator';
import SafetySection from '../components/home/SafetySection';
import AppDownloadBanner from '../components/home/AppDownloadBanner';
import { driversApi } from '../api';
import { useSocketContext } from '../context/SocketContext';
import { SOCKET_EVENTS } from '../constants/socketEvents';

export default function HomePage() {
  const [pickupCoords, setPickupCoords] = useState([37.7749, -122.4194]);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [hasActiveRoute, setHasActiveRoute] = useState(false);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);

  const { socket } = useSocketContext();

  // Fetch real online drivers from backend & sync local live driver
  useEffect(() => {
    let isMounted = true;

    const fetchDrivers = async () => {
      try {
        const res = await driversApi.getNearbyDrivers(pickupCoords[0], pickupCoords[1]);
        if (res && res.data && isMounted) {
          const formatted = (res.data || []).map((d) => ({
            id: d.id,
            vehicle_model: `${d.vehicle_make || 'Uber'} ${d.vehicle_model || 'Driver'}`,
            latitude: Number(d.current_latitude || d.latitude),
            longitude: Number(d.current_longitude || d.longitude),
            rating: Number(d.rating || 5.0),
            heading: Number(d.heading || 0)
          }));

          // Merge local driver if currently marked online in this browser
          try {
            const isOnline = localStorage.getItem('driver_is_online') === 'true';
            const saved = JSON.parse(localStorage.getItem('registered_driver') || 'null');
            if (isOnline && saved) {
              const coords = JSON.parse(localStorage.getItem('driver_last_coords') || 'null') || pickupCoords;
              formatted.push({
                id: 'my_live_driver',
                vehicle_model: `${saved.fullName} (${saved.vehicleMake} ${saved.vehicleModel})`,
                latitude: coords[0],
                longitude: coords[1],
                rating: 5.0,
                heading: 0
              });
            }
          } catch {}

          setNearbyDrivers(formatted);
        }
      } catch (err) {
        // If error or no drivers online, fallback to empty array
        if (isMounted) setNearbyDrivers([]);
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
      <section id="ride" className="relative py-10 lg:py-16 bg-black">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Left Column: Official Uber Request Engine */}
            <div className="lg:col-span-5 flex justify-center lg:justify-start z-10">
              <RideBookingWidget
                onRouteCalculated={handleRouteCalculated}
              />
            </div>

            {/* Right Column: Official Uber Photography Collage + Live Leaflet Toggle */}
            <div className="lg:col-span-7 flex justify-center">
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
