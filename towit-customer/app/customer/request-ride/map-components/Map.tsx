"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { OSRM_BASE_URL, DEFAULT_MAP_CENTER } from "@/lib/constants";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, ZoomControl } from "react-leaflet";
import L from "leaflet";
function ChangeView({ origin, destination, towLocation }: { origin: [number, number] | null, destination: [number, number] | null, towLocation?: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [];
    if (origin) points.push(origin);
    if (destination) points.push(destination);
    if (towLocation) points.push(towLocation);

    if (points.length >= 2) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [origin, destination, towLocation, map]);

  return null;
}

function RoutingLine({ origin, destination, towLocation }: { origin?: [number, number] | null; destination: [number, number]; towLocation?: [number, number] | null }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);
  const start = (towLocation || origin)!;

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const url = `${OSRM_BASE_URL}/${start[1]},${start[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const coordinates = data.routes[0].geometry.coordinates.map(
            (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
          );
          setRouteCoords(coordinates);
        }
      } catch (err) {
        console.error("Error al cargar la ruta desde OSRM", err);
      }
    };

    fetchRoute();
  }, [start, destination]);

  if (!routeCoords) return null;

  return (
    <Polyline
      positions={routeCoords}
      pathOptions={{ color: 'black', weight: 6, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }}
    />
  );
}

const originIcon = L.divIcon({
  html: '<div style="width:22px;height:22px;background:white;border-radius:50%;border:6px solid #1a1a1a;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  className: 'bg-transparent border-none',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const destinationIcon = L.divIcon({
  html: '<div style="width:22px;height:22px;background:white;border:6px solid #1a1a1a;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
  className: 'bg-transparent border-none',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const TOW_ICON = L.divIcon({
  html: '<img src="/images/towicon/tow4.svg" alt="TowIt" style="width:34px;height:34px;" />',
  className: 'bg-transparent border-none',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

type MapProps = {
  origin?: [number, number] | null;
  destination?: [number, number] | null;
  towLocation?: [number, number] | null;
  followTower?: boolean;
};

export default function Map({ origin, destination, towLocation, followTower }: MapProps) {
  const defaultPosition: [number, number] = DEFAULT_MAP_CENTER;

  return (
    <MapContainer
      center={origin || defaultPosition}
      zoom={13}
      scrollWheelZoom={true}
      zoomControl={false}
      className="w-full h-full"
    >
      <ZoomControl position="topright" />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ChangeView origin={origin || null} destination={destination || null} towLocation={towLocation} />

      {origin && (!followTower || !towLocation) && (
        <Marker position={origin} icon={originIcon}>
          <Popup>Origen</Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={destination} icon={destinationIcon}>
          <Popup>Destino</Popup>
        </Marker>
      )}

      {towLocation && (
        <Marker
          position={towLocation}
          zIndexOffset={1000}
          icon={TOW_ICON}
        >
          <Popup>Grúa TowIt en camino</Popup>
        </Marker>
      )}

      {(origin || towLocation) && destination && (
        <RoutingLine origin={followTower ? null : origin} destination={destination} towLocation={followTower ? towLocation : null} />
      )}
    </MapContainer>
  );
}