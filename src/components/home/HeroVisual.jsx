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
      {/* Container with top-aligned bounds (18px corner radius & subtle border) */}
      <div className="relative rounded-[18px] overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950">
        {/* Compact Floating View Mode Toggle (Top Right Overlay) */}
        <div className="absolute top-3 right-3 z-20 bg-neutral-950/80 border border-neutral-800 backdrop-blur-md p-0.5 rounded-lg flex items-center space-x-1 text-xs shadow-lg">
          <button
            type="button"
            onClick={() => setViewMode('gallery')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
              viewMode === 'gallery'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white font-medium'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Gallery</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs transition cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-black font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-white font-medium'
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
              height="550px"
            />
          </div>
        ) : (
          /* Hero Photography Collage */
          <div className="relative rounded-[18px] overflow-hidden select-none">
            <div className="grid grid-cols-2 gap-2 h-[550px]">
              {/* Top Left */}
              <div className="rounded-xl overflow-hidden h-[268px]">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=800&auto=format&fit=crop"
                  alt="Couple smiling at night"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Top Right */}
              <div className="rounded-xl overflow-hidden h-[268px]">
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop"
                  alt="Executive traveler with phone"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bottom Left */}
              <div className="rounded-xl overflow-hidden h-[272px]">
                <img
                  src="https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=800&auto=format&fit=crop"
                  alt="Urban street ride"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bottom Right */}
              <div className="rounded-xl overflow-hidden h-[272px]">
                <img
                  src="https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=800&auto=format&fit=crop"
                  alt="Friends traveling in city"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Floating "Ready to travel? Schedule ahead" Banner */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 bg-neutral-950/85 backdrop-blur-md border border-neutral-800 p-3 rounded-xl flex items-center justify-between shadow-xl">
              <div>
                <h4 className="text-white font-semibold text-xs">Ready to travel?</h4>
                <p className="text-[11px] text-neutral-400">Reserve a ride up to 90 days in advance</p>
              </div>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className="px-3 py-1.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-neutral-200 transition shadow-sm active:scale-95 flex items-center space-x-1 cursor-pointer"
              >
                <span>Schedule ahead</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Map Subtext */}
      {viewMode === 'map' && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-neutral-400 px-1">
          <span>
            {nearbyDrivers && nearbyDrivers.length > 0
              ? `${nearbyDrivers.length} driver${nearbyDrivers.length > 1 ? 's' : ''} live nearby`
              : 'No drivers online nearby · Go Live in Drive tab'}
          </span>
          <span className="text-neutral-500">Scroll wheel or + / − to zoom</span>
        </div>
      )}
    </div>
  );
}
