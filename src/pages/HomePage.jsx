import React, { useState } from 'react';
import RideBookingWidget from '../components/booking/RideBookingWidget';
import HeroVisual from '../components/home/HeroVisual';
import SuggestionsRow from '../components/home/SuggestionsRow';
import FeaturesShowcase from '../components/home/FeaturesShowcase';
import DriverEarningsCalculator from '../components/home/DriverEarningsCalculator';
import SafetySection from '../components/home/SafetySection';
import AppDownloadBanner from '../components/home/AppDownloadBanner';

const INITIAL_NEARBY_DRIVERS = [
  { id: 'd1', vehicle_model: 'Toyota Camry (UberX)', latitude: 37.7780, longitude: -122.4170, rating: 4.95, heading: 45 },
  { id: 'd2', vehicle_model: 'Tesla Model Y (Comfort)', latitude: 37.7720, longitude: -122.4230, rating: 4.98, heading: 90 },
  { id: 'd3', vehicle_model: 'Chevy Suburban (UberXL)', latitude: 37.7810, longitude: -122.4120, rating: 4.91, heading: 180 },
  { id: 'd4', vehicle_model: 'Mercedes-Benz E-Class (Black)', latitude: 37.7690, longitude: -122.4150, rating: 5.0, heading: 270 }
];

export default function HomePage() {
  const [pickupCoords, setPickupCoords] = useState([37.7749, -122.4194]);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [hasActiveRoute, setHasActiveRoute] = useState(false);

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
                nearbyDrivers={INITIAL_NEARBY_DRIVERS}
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
