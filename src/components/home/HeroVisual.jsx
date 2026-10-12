import React, { useState, useEffect } from 'react';
import InteractiveMap from '../map/InteractiveMap';
import { Map, Image, ArrowRight } from 'lucide-react';

export default function HeroVisual({
  pickupCoords,
  dropoffCoords,
  routeCoordinates,
  nearbyDrivers,
  hasActiveRoute
}) {
  // If active route is calculated, show map by default, otherwise allow toggle
  const [viewMode, setViewMode] = useState(hasActiveRoute ? 'map' : 'gallery');

  useEffect(() => {
    if (hasActiveRoute) {
      setViewMode('map');
    }
  }, [hasActiveRoute]);

  return (
    <div className="relative w-full">
      {/* Container with top-aligned bounds */}
      <div className="relative rounded-3xl overflow-hidden border border-neutral-850 shadow-2xl bg-neutral-950">
        {/* Sleek Floating View Mode Toggle (Top Right Overlay) */}
        <div className="absolute top-4 right-4 z-20 bg-neutral-900/90 border border-neutral-750 backdrop-blur-md p-1 rounded-lg flex items-center space-x-1 text-xs shadow-2xl">
          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              viewMode === 'gallery'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Gallery</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-semibold transition cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Live Map</span>
          </button>
        </div>

        {viewMode === 'map' ? (
          /* Interactive Leaflet Map */
          <div className="relative w-full">
            <InteractiveMap
              pickupCoords={pickupCoords}
              dropoffCoords={dropoffCoords}
              routeCoordinates={routeCoordinates}
              nearbyDrivers={nearbyDrivers}
              height="640px"
            />
          </div>
        ) : (
          /* Official Uber Hero Photography Collage matching uber.com */
          <div className="relative rounded-3xl overflow-hidden select-none">
            <div className="grid grid-cols-2 gap-3 h-[640px]">
              {/* Top Left */}
              <div className="rounded-2xl overflow-hidden h-[310px]">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop"
                  alt="Couple smiling at night"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Top Right */}
              <div className="rounded-2xl overflow-hidden h-[310px]">
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop"
                  alt="Executive traveler with phone"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bottom Left */}
              <div className="rounded-2xl overflow-hidden h-[315px]">
                <img
                  src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop"
                  alt="Urban street ride"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bottom Right */}
              <div className="rounded-2xl overflow-hidden h-[315px]">
                <img
                  src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop"
                  alt="Friends traveling in city"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Floating "Ready to travel? Schedule ahead" Banner matching screenshot */}
            <div className="absolute bottom-5 left-5 right-5 bg-black/80 backdrop-blur-md border border-neutral-700/80 p-4 rounded-2xl flex items-center justify-between shadow-2xl">
              <div>
                <h4 className="text-white font-bold text-sm">Ready to travel?</h4>
                <p className="text-xs text-neutral-300">Reserve a ride up to 90 days in advance</p>
              </div>
              <button
                onClick={() => setViewMode('map')}
                className="px-4 py-2 bg-white text-black font-bold text-xs rounded-lg hover:bg-neutral-200 transition shadow-sm active:scale-95 flex items-center space-x-1 cursor-pointer"
              >
                <span>Schedule ahead</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Subtext */}
      {viewMode === 'map' && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-neutral-400 px-1">
          <span>
            {nearbyDrivers && nearbyDrivers.length > 0
              ? `${nearbyDrivers.length} driver${nearbyDrivers.length > 1 ? 's' : ''} live nearby`
              : 'No drivers online nearby · Go Live in Drive tab'}
          </span>
          <span className="text-neutral-500">Scroll wheel or + / − to zoom map</span>
        </div>
      )}
    </div>
  );
}
