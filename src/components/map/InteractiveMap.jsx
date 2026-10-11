import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Uber style DivIcons
const createCustomIcon = (type, label = '') => {
  let innerHtml = '';

  if (type === 'pickup') {
    innerHtml = `
      <div style="background-color: #000000; border: 3px solid #ffffff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.4);">
        <div style="background-color: #ffffff; width: 10px; height: 10px; border-radius: 50%;"></div>
      </div>
    `;
  } else if (type === 'dropoff') {
    innerHtml = `
      <div style="background-color: #ffffff; border: 3px solid #000000; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.4);">
        <div style="background-color: #000000; width: 12px; height: 12px; border-radius: 2px;"></div>
      </div>
    `;
  } else if (type === 'car') {
    innerHtml = `
      <div style="background-color: #000000; border: 2px solid #3b82f6; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 10px rgba(0,0,0,0.5); transform: rotate(${label}deg);">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    `;
  }

  return L.divIcon({
    html: innerHtml,
    className: 'custom-leaflet-marker',
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

// Component to dynamically fit map bounds to route or coordinates
function AutoFitBounds({ pickup, dropoff, routeCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (pickup && dropoff) {
      const bounds = L.latLngBounds([pickup, dropoff]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    } else if (pickup) {
      map.setView(pickup, 14, { animate: true });
    }
  }, [pickup, dropoff, routeCoordinates, map]);

  return null;
}

export default function InteractiveMap({
  pickupCoords = [37.7749, -122.4194],
  dropoffCoords = null,
  routeCoordinates = [],
  nearbyDrivers = [],
  height = '560px'
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const defaultCenter = pickupCoords || [37.7749, -122.4194];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl" style={{ height }}>
      {/* Map Floating Status Pill */}
      <div className="absolute top-4 left-4 z-[400] bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-neutral-700/60 flex items-center space-x-2 text-xs font-semibold text-white shadow-lg pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <span>Leaflet Live GPS</span>
        <span className="text-neutral-400">·</span>
        <span className="text-neutral-300">OpenStreetMap</span>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="w-full h-full dark-tiles"
      >
        {/* OpenStreetMap Tile Layer with stylish dark mode invert */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto fit map viewpoint */}
        <AutoFitBounds
          pickup={pickupCoords}
          dropoff={dropoffCoords}
          routeCoordinates={routeCoordinates}
        />

        {/* Pickup Marker */}
        {pickupCoords && (
          <Marker position={pickupCoords} icon={createCustomIcon('pickup')}>
            <Popup className="text-black font-semibold">
              Pickup Point
            </Popup>
          </Marker>
        )}

        {/* Dropoff Marker */}
        {dropoffCoords && (
          <Marker position={dropoffCoords} icon={createCustomIcon('dropoff')}>
            <Popup className="text-black font-semibold">
              Destination
            </Popup>
          </Marker>
        )}

        {/* Live Active Driving Route Polyline */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color="#ffffff"
            weight={5}
            opacity={0.9}
            dashArray="1, 8"
            lineCap="round"
          />
        )}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color="#2563eb"
            weight={4}
            opacity={0.85}
          />
        )}

        {/* Nearby Drivers Markers */}
        {nearbyDrivers.map((driver, idx) => (
          <Marker
            key={driver.id || idx}
            position={[driver.latitude || driver.current_latitude, driver.longitude || driver.current_longitude]}
            icon={createCustomIcon('car', driver.heading || idx * 45)}
          >
            <Popup className="text-black font-sans text-xs">
              <strong>{driver.vehicle_model || 'Uber Driver'}</strong>
              <br />
              Rating: ⭐ {driver.rating || '5.0'}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
