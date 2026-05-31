"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import { OSRM_BASE_URL, DEFAULT_MAP_CENTER } from "@/lib/constants";

import { useEffect, useMemo, useState } from "react";
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

function RoutingLine({ origin, destination }: { origin: [number, number] | null, destination: [number, number] | null }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoords(null);
      return;
    }

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

function getCarIcon(craneType: string) {
  if (craneType === "medium") {
    return L.divIcon({
      html: '<svg viewBox="0 0 640 512" style="width:32px;height:32px;fill:#1a1a1a;filter:drop-shadow(0 0 0 2px white);"><path d="M171.3 96H224v96H111.3l60.1-96zM96 192h-3.2c-19.9 0-38.3 7.9-52.1 21.9L9.5 247.4C3.3 253.9 0 262.5 0 271.4V352c0 17.7 14.3 32 32 32h32c0 53 43 96 96 96s96-43 96-96h128c0 53 43 96 96 96s96-43 96-96h32c17.7 0 32-14.3 32-32V271.4c0-8.9-3.3-17.5-9.5-24L598 213.9C584.2 199.9 565.8 192 545.9 192H480V112c0-26.5-21.5-48-48-48H272c-26.5 0-48 21.5-48 48v80H96zM480 288c0 26.5-21.5 48-48 48s-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48zM160 336c-26.5 0-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48s-21.5 48-48 48z"/></svg>',
      className: 'bg-transparent border-none',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }
  if (craneType === "large") {
    return L.divIcon({
      html: '<svg viewBox="0 0 640 512" style="width:32px;height:32px;fill:#1a1a1a;filter:drop-shadow(0 0 0 2px white);"><path d="M368 0c-8.8 0-16 7.2-16 16V96h-3.2c-19.9 0-38.3 7.9-52.1 21.9L265.5 149.4C259.3 155.9 256 164.5 256 173.4V256H144V48c0-8.8-7.2-16-16-16H80c-8.8 0-16 7.2-16 16V256H32c-17.7 0-32 14.3-32 32v80c0 17.7 14.3 32 32 32h32c0 53 43 96 96 96s96-43 96-96h96c0 53 43 96 96 96s96-43 96-96h32c17.7 0 32-14.3 32-32V288c0-35.3-28.7-64-64-64H384V32c0-17.7-14.3-32-32-32H368zM208 384c-26.5 0-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48s-21.5 48-48 48zm224-48c0 26.5-21.5 48-48 48s-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48z"/></svg>',
      className: 'bg-transparent border-none',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  }
  return L.divIcon({
    html: '<img src="/images/logo/tow2.svg" style="width:32px;height:32px;filter:drop-shadow(0 0 0 2px white);" />',
    className: 'bg-transparent border-none',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

type MapProps = {
  origin?: [number, number] | null;
  destination?: [number, number] | null;
  towLocation?: [number, number] | null;
  craneType?: string;
};

export default function Map({ origin, destination, towLocation, craneType = "conventional" }: MapProps) {
  const defaultPosition: [number, number] = DEFAULT_MAP_CENTER;

  const carIcon = useMemo(() => getCarIcon(craneType), [craneType]);

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
          icon={carIcon}
        >
          <Popup>Grúa TowIt en camino</Popup>
        </Marker>
      )}

      <RoutingLine origin={origin || null} destination={destination || null} />
    </MapContainer>
  );
}