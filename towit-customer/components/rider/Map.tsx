"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Componente auxiliar para ajustar el mapa a los marcadores
function ChangeView({ origin, destination }: { origin: [number, number] | null, destination: [number, number] | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (origin && destination) {
      // Si tenemos ambos, ajustamos la vista para que se vean los dos
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

type MapProps = {
  origin?: [number, number] | null;
  destination?: [number, number] | null;
};

export default function Map({ origin, destination }: MapProps) {
  const defaultPosition: [number, number] = [-38.7333, -62.2667]; // Coordenadas de Buenos Aires

  return (
    <MapContainer
      center={origin || defaultPosition}
      zoom={13}
      scrollWheelZoom={false}
      className="w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <ChangeView origin={origin || null} destination={destination || null} />

      {origin && (
        <Marker position={origin}>
          <Popup>Origen</Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={destination}>
          <Popup>Destino</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}