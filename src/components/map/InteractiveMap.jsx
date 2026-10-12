import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Compass,
  Sun,
  Moon,
  Car as CarIcon,
  Navigation,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

// Top-Down realistic white car icon matching screenshot 2
const createCarIcon = (heading = 0) => {
  const innerHtml = `
    <div style="width: 24px; height: 50px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transform-origin: center center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.55)); transition: transform 0.6s ease;">
      <svg width="24" height="50" viewBox="0 0 24 50" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Car Chassis / White Body -->
        <path d="M 5.5,9.5 C 5.5,4 8,1.2 12,1.2 C 16,1.2 18.5,4 18.5,9.5 L 19,38 C 19,43.5 16.5,47 12,47 C 7.5,47 5,43.5 5,38 Z" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.3" stroke-linejoin="round" />
        
        <!-- Left Mirror -->
        <path d="M 3.2,14 C 2.5,14 2,15 2.2,16.5 C 2.4,17.5 3,18 4.2,17.5" fill="#FFFFFF" stroke="#334155" stroke-width="0.8" />
        <!-- Right Mirror -->
        <path d="M 20.8,14 C 21.5,14 22,15 21.8,16.5 C 21.6,17.5 21,18 19.8,17.5" fill="#FFFFFF" stroke="#334155" stroke-width="0.8" />

        <!-- Front Windshield (curved dark glass) -->
        <path d="M 6.8,13.5 C 8.8,12.8 15.2,12.8 17.2,13.5 L 16.2,20.5 C 14.5,20 9.5,20 7.8,20.5 Z" fill="#0F172A" />
        <!-- Windshield reflection highlight -->
        <path d="M 8.2,14.5 L 10.5,14.5 L 9.5,19.5 L 7.8,19.5 Z" fill="#94A3B8" opacity="0.75" />

        <!-- Side Windows -->
        <path d="M 6,21.5 L 6.6,28.5 L 5.6,29 L 5.4,22 Z" fill="#0F172A" />
        <path d="M 18,21.5 L 17.4,28.5 L 18.4,29 L 18.6,22 Z" fill="#0F172A" />

        <!-- Roof / Sunroof Contour -->
        <rect x="7.8" y="22" width="8.4" height="6.5" rx="1.5" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="0.5" />

        <!-- Rear Window -->
        <path d="M 7.2,30.5 C 9.2,31 14.8,31 16.8,30.5 L 16.2,35 C 14.2,34.5 9.8,34.5 7.8,35 Z" fill="#0F172A" />

        <!-- Front Headlights (amber/yellow glow) -->
        <path d="M 5.8,2.2 C 6.8,2.2 7.6,3 7.6,4 L 5.4,4.2 Z" fill="#FEF08A" />
        <path d="M 18.2,2.2 C 17.2,2.2 16.4,3 16.4,4 L 18.6,4.2 Z" fill="#FEF08A" />

        <!-- Rear Taillights (distinct red accents) -->
        <path d="M 5.4,42.5 C 5.4,44.5 6.8,45.5 8.2,45.5 L 7.8,43 Z" fill="#EF4444" />
        <path d="M 18.6,42.5 C 18.6,44.5 17.2,45.5 15.8,45.5 L 16.2,43 Z" fill="#EF4444" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html: innerHtml,
    className: 'custom-vehicle-car-marker',
    iconSize: [24, 50],
    iconAnchor: [12, 25]
  });
};

// Top-Down realistic motorcycle / scooter icon matching screenshot 2
const createBikeIcon = (heading = 0) => {
  const innerHtml = `
    <div style="width: 20px; height: 42px; display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transform-origin: center center; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.55)); transition: transform 0.6s ease;">
      <svg width="20" height="42" viewBox="0 0 20 42" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Front Wheel -->
        <rect x="9" y="1" width="2" height="7" rx="1" fill="#111827" />
        
        <!-- Handlebars -->
        <path d="M 3.5,8 C 7,7.2 13,7.2 16.5,8" stroke="#1F2937" stroke-width="2.2" stroke-linecap="round" />
        <!-- Hand Grips -->
        <circle cx="3.5" cy="8" r="1.2" fill="#F97316" />
        <circle cx="16.5" cy="8" r="1.2" fill="#F97316" />

        <!-- Front Fairing / Headlight -->
        <path d="M 8.5,8.5 L 11.5,8.5 L 11,12 L 9,12 Z" fill="#F97316" />
        <circle cx="10" cy="8.2" r="1" fill="#FEF08A" />

        <!-- Rider Arms / Body -->
        <path d="M 5,14.5 C 5,12 8,11 10,11 C 12,11 15,12 15,14.5 L 14,19 L 6,19 Z" fill="#1E293B" />

        <!-- Rider Helmet with cyan visor -->
        <circle cx="10" cy="14" r="3.2" fill="#0F172A" stroke="#475569" stroke-width="0.8" />
        <path d="M 8.2,12.8 Q 10,11.5 11.8,12.8" stroke="#38BDF8" stroke-width="1.2" stroke-linecap="round" />

        <!-- Bike Seat / Chassis -->
        <path d="M 8.2,19 L 11.8,19 L 11.2,29 L 8.8,29 Z" fill="#334155" />

        <!-- Rear Wheel -->
        <rect x="9" y="29" width="2" height="8" rx="1" fill="#111827" />

        <!-- Taillight -->
        <circle cx="10" cy="30" r="1.2" fill="#EF4444" />
      </svg>
    </div>
  `;

  return L.divIcon({
    html: innerHtml,
    className: 'custom-vehicle-bike-marker',
    iconSize: [20, 42],
    iconAnchor: [10, 21]
  });
};

// Custom Uber style DivIcons for Pickup & Destination
export const createCustomIcon = (type, label = '', heading = 0) => {
  let innerHtml = '';

  if (type === 'pickup') {
    innerHtml = `
      <div style="background-color: #000000; border: 3px solid #ffffff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
        <div style="background-color: #ffffff; width: 10px; height: 10px; border-radius: 50%;"></div>
      </div>
    `;
    return L.divIcon({
      html: innerHtml,
      className: 'custom-leaflet-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  }

  if (type === 'dropoff') {
    innerHtml = `
      <div style="background-color: #ffffff; border: 3px solid #000000; width: 34px; height: 34px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.5);">
        <div style="background-color: #000000; width: 12px; height: 12px; border-radius: 2px;"></div>
      </div>
    `;
    return L.divIcon({
      html: innerHtml,
      className: 'custom-leaflet-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  }

  if (type === 'bike') {
    return createBikeIcon(heading);
  }

  return createCarIcon(heading);
};

// Component to dynamically fit map bounds to route or coordinates
function AutoFitBounds({ pickup, dropoff, routeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 1) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (pickup && dropoff) {
      const pLat = Array.isArray(pickup) ? pickup[0] : pickup?.lat;
      const pLng = Array.isArray(pickup) ? pickup[1] : pickup?.lng;
      const dLat = Array.isArray(dropoff) ? dropoff[0] : dropoff?.lat;
      const dLng = Array.isArray(dropoff) ? dropoff[1] : dropoff?.lng;
      if (pLat && pLng && dLat && dLng) {
        const bounds = L.latLngBounds([[pLat, pLng], [dLat, dLng]]);
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
      }
    } else if (pickup) {
      const pLat = Array.isArray(pickup) ? pickup[0] : pickup?.lat;
      const pLng = Array.isArray(pickup) ? pickup[1] : pickup?.lng;
      if (pLat && pLng) {
        map.setView([pLat, pLng], 14, { animate: true });
      }
    }
  }, [
    pickup ? (Array.isArray(pickup) ? pickup.join(',') : `${pickup.lat},${pickup.lng}`) : '',
    dropoff ? (Array.isArray(dropoff) ? dropoff.join(',') : `${dropoff.lat},${dropoff.lng}`) : '',
    routeCoordinates?.length,
    map
  ]);

  return null;
}

// Auto invalidates map container size when parent/viewport dimensions change
function AutoResizeMap({ height }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map, height]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => map.invalidateSize(), 200);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [map]);

  return null;
}

// Dedicated sleek Zoom & Map Controls component inside MapContainer
function MapZoomControls({
  pickupCoords,
  dropoffCoords,
  routeCoordinates,
  mapTheme,
  setMapTheme,
  onToggleFullscreen,
  isFullscreen
}) {
  const map = useMap();
  const [zoomLevel, setZoomLevel] = useState(map.getZoom());
  const controlRef = useRef(null);

  const zoomInRef = useRef(null);
  const zoomOutRef = useRef(null);
  const recenterRef = useRef(null);
  const themeRef = useRef(null);
  const fullscreenRef = useRef(null);

  useEffect(() => {
    const onZoom = () => {
      setZoomLevel(map.getZoom());
    };
    map.on('zoomend', onZoom);
    return () => {
      map.off('zoomend', onZoom);
    };
  }, [map]);

  // Attach direct native event listeners to guarantee button execution in Leaflet
  useEffect(() => {
    const btnIn = zoomInRef.current;
    const btnOut = zoomOutRef.current;
    const btnRecenter = recenterRef.current;
    const btnTheme = themeRef.current;
    const btnFs = fullscreenRef.current;

    const onZoomIn = (e) => {
      e.preventDefault();
      e.stopPropagation();
      map.zoomIn();
    };

    const onZoomOut = (e) => {
      e.preventDefault();
      e.stopPropagation();
      map.zoomOut();
    };

    const onRecenter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (routeCoordinates && routeCoordinates.length > 0) {
        map.fitBounds(L.latLngBounds(routeCoordinates), { padding: [50, 50] });
      } else if (pickupCoords && dropoffCoords) {
        map.fitBounds(L.latLngBounds([pickupCoords, dropoffCoords]), { padding: [60, 60] });
      } else if (pickupCoords) {
        map.setView(pickupCoords, 14, { animate: true });
      }
    };

    const onTheme = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setMapTheme((prev) => (prev === 'dark' ? 'street' : 'dark'));
    };

    const onFs = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (onToggleFullscreen) onToggleFullscreen();
    };

    btnIn?.addEventListener('click', onZoomIn);
    btnOut?.addEventListener('click', onZoomOut);
    btnRecenter?.addEventListener('click', onRecenter);
    btnTheme?.addEventListener('click', onTheme);
    btnFs?.addEventListener('click', onFs);

    return () => {
      btnIn?.removeEventListener('click', onZoomIn);
      btnOut?.removeEventListener('click', onZoomOut);
      btnRecenter?.removeEventListener('click', onRecenter);
      btnTheme?.removeEventListener('click', onTheme);
      btnFs?.removeEventListener('click', onFs);
    };
  }, [map, routeCoordinates, pickupCoords, dropoffCoords, setMapTheme, onToggleFullscreen]);

  return (
    <div
      ref={controlRef}
      className="leaflet-top leaflet-right pointer-events-auto"
      style={{ margin: '48px 12px 12px 12px', zIndex: 1000 }}
      onMouseDown={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Grouped Minimalist Floating Map Toolbar */}
      <div className="bg-neutral-950/85 backdrop-blur-md border border-neutral-800 rounded-lg p-0.5 shadow-lg flex flex-col items-center divide-y divide-neutral-850 select-none">
        {/* Zoom In & Out */}
        <div className="flex flex-col items-center pb-0.5">
          <button
            ref={zoomInRef}
            type="button"
            onClick={(e) => { e.stopPropagation(); map.zoomIn(); }}
            title="Zoom In (+)"
            className="w-7 h-7 flex items-center justify-center hover:bg-neutral-800 active:scale-95 rounded-md transition text-neutral-300 hover:text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>

          {/* Zoom Level Indicator */}
          <div className="py-0.5 text-[9px] font-mono font-bold text-neutral-400">
            {zoomLevel}x
          </div>

          <button
            ref={zoomOutRef}
            type="button"
            onClick={(e) => { e.stopPropagation(); map.zoomOut(); }}
            title="Zoom Out (−)"
            className="w-7 h-7 flex items-center justify-center hover:bg-neutral-800 active:scale-95 rounded-md transition text-neutral-300 hover:text-white cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="pt-0.5 flex flex-col items-center space-y-0.5">
          {/* Re-center / Fit bounds */}
          <button
            ref={recenterRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (routeCoordinates && routeCoordinates.length > 0) {
                map.fitBounds(L.latLngBounds(routeCoordinates), { padding: [40, 40] });
              } else if (pickupCoords && dropoffCoords) {
                map.fitBounds(L.latLngBounds([pickupCoords, dropoffCoords]), { padding: [50, 50] });
              } else if (pickupCoords) {
                map.setView(pickupCoords, 14, { animate: true });
              }
            }}
            title="Re-center on Route"
            className="w-7 h-7 flex items-center justify-center hover:bg-neutral-800 active:scale-95 rounded-md transition text-neutral-300 hover:text-white cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-neutral-200" />
          </button>

          {/* Map Style Theme (Dark / Light) */}
          <button
            ref={themeRef}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMapTheme((prev) => (prev === 'dark' ? 'street' : 'dark'));
            }}
            title={mapTheme === 'dark' ? 'Street View' : 'Dark View'}
            className="w-7 h-7 flex items-center justify-center hover:bg-neutral-800 active:scale-95 rounded-md transition text-neutral-300 hover:text-white cursor-pointer"
          >
            {mapTheme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
          </button>

          {/* Fullscreen Toggle */}
          {onToggleFullscreen && (
            <button
              ref={fullscreenRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFullscreen();
              }}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="w-7 h-7 flex items-center justify-center hover:bg-neutral-800 active:scale-95 rounded-md transition text-neutral-300 hover:text-white cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-3.5 h-3.5 text-white" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5 text-white" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function InteractiveMap({
  pickupCoords = [22.6113, 88.4202],
  dropoffCoords = null,
  routeCoordinates = [],
  nearbyDrivers = [],
  height = '560px',
  allowFullscreen = true
}) {
  const [mounted, setMounted] = useState(false);
  const [mapTheme, setMapTheme] = useState('dark'); // 'dark' | 'street'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const getInitialRoute = () => {
    if (routeCoordinates && routeCoordinates.length > 0) return routeCoordinates;
    const pLat = Array.isArray(pickupCoords) ? pickupCoords[0] : pickupCoords?.lat;
    const pLng = Array.isArray(pickupCoords) ? pickupCoords[1] : pickupCoords?.lng;
    const dLat = Array.isArray(dropoffCoords) ? dropoffCoords[0] : dropoffCoords?.lat;
    const dLng = Array.isArray(dropoffCoords) ? dropoffCoords[1] : dropoffCoords?.lng;
    if (pLat && pLng && dLat && dLng) {
      return [[pLat, pLng], [dLat, dLng]];
    }
    return [];
  };

  const [activeRoute, setActiveRoute] = useState(getInitialRoute);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute / fetch real OSRM road geometry if routeCoordinates is empty but pickup and dropoff are provided
  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      setActiveRoute(routeCoordinates);
      return;
    }

    const pLat = Number(Array.isArray(pickupCoords) ? pickupCoords[0] : pickupCoords?.lat);
    const pLng = Number(Array.isArray(pickupCoords) ? pickupCoords[1] : pickupCoords?.lng);
    const dLat = Number(Array.isArray(dropoffCoords) ? dropoffCoords[0] : dropoffCoords?.lat);
    const dLng = Number(Array.isArray(dropoffCoords) ? dropoffCoords[1] : dropoffCoords?.lng);

    if (pLat && pLng && dLat && dLng) {
      let isCurrent = true;
      // Immediately set direct 2-point line so blue line is visible instantly without delay
      setActiveRoute(prev => (prev && prev.length > 1 ? prev : [[pLat, pLng], [dLat, dLng]]));

      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          const data = await res.json();
          if (isCurrent && data?.routes?.[0]?.geometry?.coordinates) {
            const poly = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
            setActiveRoute(poly);
            return;
          }
        } catch (e) {
          console.warn('OSRM routing fetch fallback', e);
        }
        if (isCurrent) {
          setActiveRoute([[pLat, pLng], [dLat, dLng]]);
        }
      };

      fetchRoute();
      return () => { isCurrent = false; };
    } else {
      setActiveRoute([]);
    }
  }, [
    pickupCoords ? (Array.isArray(pickupCoords) ? pickupCoords.join(',') : `${pickupCoords.lat},${pickupCoords.lng}`) : '',
    dropoffCoords ? (Array.isArray(dropoffCoords) ? dropoffCoords.join(',') : `${dropoffCoords.lat},${dropoffCoords.lng}`) : '',
    routeCoordinates
  ]);

  // Handle ESC key for exiting fullscreen modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!mounted) {
    return (
      <div
        style={{ height }}
        className="w-full bg-neutral-900 animate-pulse rounded-2xl flex items-center justify-center text-neutral-500 text-sm"
      >
        Loading live OpenStreetMap...
      </div>
    );
  }

  const defaultCenter = pickupCoords || [22.6113, 88.4202];

  // Inner Map Content
  const renderMapContent = (containerHeight) => (
    <div
      className="relative w-full rounded-[18px] overflow-hidden border border-neutral-800 shadow-xl isolate z-0 transition-all"
      style={{ height: containerHeight }}
    >
      {/* Map Tile Container */}
      <MapContainer
        center={defaultCenter}
        zoom={14}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        className={`w-full h-full ${mapTheme === 'dark' ? 'dark-tiles' : 'light-tiles'}`}
      >
        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Automatic Viewport & Dynamic Height Invalidation */}
        <AutoResizeMap height={height} />

        {/* Custom Dedicated Zoom & Navigation Controls */}
        <MapZoomControls
          pickupCoords={pickupCoords}
          dropoffCoords={dropoffCoords}
          routeCoordinates={activeRoute}
          mapTheme={mapTheme}
          setMapTheme={setMapTheme}
          onToggleFullscreen={allowFullscreen ? () => setIsFullscreen(!isFullscreen) : null}
          isFullscreen={isFullscreen}
        />

        {/* Auto fit viewpoint */}
        <AutoFitBounds
          pickup={pickupCoords}
          dropoff={dropoffCoords}
          routeCoordinates={activeRoute}
        />

        {/* Pickup Marker */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={createCustomIcon('pickup')}>
            <Popup className="text-black font-semibold text-xs">
              <div className="p-1">
                <strong className="block text-sm">Pickup Point</strong>
                <span className="text-neutral-600 text-[11px]">Meet your driver here</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff Marker */}
        {dropoffCoords && (
          <Marker position={dropoffCoords} icon={createCustomIcon('dropoff')}>
            <Popup className="text-black font-semibold text-xs">
              <div className="p-1">
                <strong className="block text-sm">Destination</strong>
                <span className="text-neutral-600 text-[11px]">Dropoff location</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline Background Glow */}
        {activeRoute && activeRoute.length > 0 && (
          <Polyline
            key={`glow-${activeRoute.length}-${activeRoute[0]?.[0] || 0}`}
            positions={activeRoute}
            color="#ffffff"
            weight={7}
            opacity={0.8}
            dashArray="1, 8"
            lineCap="round"
          />
        )}
        {/* Route Polyline Main Solid Royal Blue Drive Line */}
        {activeRoute && activeRoute.length > 0 && (
          <Polyline
            key={`blue-route-${activeRoute.length}-${activeRoute[0]?.[0] || 0}`}
            positions={activeRoute}
            color="#2563eb"
            weight={5}
            opacity={1.0}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Real Online Vehicles (Cars and Bikes) */}
        {nearbyDrivers.map((vehicle, idx) => {
          const lat = vehicle.latitude || vehicle.current_latitude;
          const lng = vehicle.longitude || vehicle.current_longitude;
          if (!lat || !lng) return null;

          const isBike =
            vehicle.type === 'bike' ||
            vehicle.vehicle_type === 'bike' ||
            (vehicle.vehicle_model && vehicle.vehicle_model.toLowerCase().includes('bike')) ||
            (vehicle.vehicle_model && vehicle.vehicle_model.toLowerCase().includes('moto'));

          const icon = isBike
            ? createBikeIcon(vehicle.heading || 0)
            : createCarIcon(vehicle.heading || 0);

          return (
            <Marker
              key={vehicle.id || idx}
              position={[lat, lng]}
              icon={icon}
            >
              <Popup className="text-black font-sans text-xs">
                <div className="p-1.5 space-y-1 min-w-[150px]">
                  <div className="flex items-center space-x-1.5 font-bold text-neutral-900 text-xs">
                    <span>{vehicle.vehicle_model || (isBike ? 'Bike' : 'Uber Driver')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-600">
                    <span>★ {vehicle.rating || '5.0'}</span>
                    <span className="font-semibold text-emerald-600">Online & Ready</span>
                  </div>
                  <div className="pt-1 border-t border-neutral-200 text-[10px]">
                    <span className="text-neutral-500 font-medium">
                      {vehicle.driver_name || vehicle.fullName || 'Verified Driver'}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );

  return (
    <>
      {/* Standard Inline Map View */}
      {renderMapContent(height)}

      {/* Expanded Fullscreen Zoom Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-200 select-none">
          {/* Fullscreen Header with Controls */}
          <div className="flex items-center justify-between mb-3 bg-neutral-900/90 border border-neutral-800 px-5 py-3 rounded-2xl shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center text-white">
                <Navigation className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-sm sm:text-base">
                  Uber Live GPS Fleet Radar
                </h3>
                <p className="text-xs text-neutral-400">
                  {nearbyDrivers.length > 0
                    ? `${nearbyDrivers.length} active driver${nearbyDrivers.length > 1 ? 's' : ''} online in this zone · Scroll or use +/− to zoom in/out`
                    : 'No drivers currently online nearby · Scroll or use +/− to zoom in/out'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Map Theme Toggle */}
              <button
                type="button"
                onClick={() => setMapTheme((t) => (t === 'dark' ? 'street' : 'dark'))}
                className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border border-neutral-700 cursor-pointer"
              >
                {mapTheme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Street View</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>Dark View</span>
                  </>
                )}
              </button>

              {/* Close / Minimize Button */}
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition cursor-pointer border border-neutral-700 active:scale-95"
                title="Close Fullscreen (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Fullscreen Map Canvas */}
          <div className="flex-1 w-full relative rounded-2xl overflow-hidden border border-neutral-800">
            {renderMapContent('100%')}
          </div>
        </div>
      )}
    </>
  );
}
