"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { OSRM_BASE_URL, DEFAULT_MAP_CENTER } from "@/lib/constants";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, ZoomControl } from "react-leaflet";
import L from "leaflet";
function ChangeView({ origin, destination }: { origin: [number, number] | null, destination: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds([origin, destination]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (origin) {
      map.setView(origin, 14);
    } else if (destination) {
      map.setView(destination, 14);
    }
  }, [origin, destination, map]);

  return null;
}

function RoutingLine({ origin, destination }: { origin: [number, number]; destination: [number, number] }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const url = `${OSRM_BASE_URL}/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
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
  }, [origin, destination]);

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
};

export default function Map({ origin, destination, towLocation }: MapProps) {
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

      <ChangeView origin={origin || null} destination={destination || null} />

      {origin && (
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

      {origin && destination && <RoutingLine origin={origin} destination={destination} />}
    </MapContainer>
  );
}