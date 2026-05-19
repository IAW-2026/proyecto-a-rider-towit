"use client";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
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

// Componente para trazar la ruta entre los dos puntos
function RoutingLine({ origin, destination }: { origin: [number, number] | null, destination: [number, number] | null }) {
  const [routeCoords, setRouteCoords] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!origin || !destination) {
      setRouteCoords(null);
      return;
    }

    const fetchRoute = async () => {
      try {
        // En OSRM las coordenadas van como longitud,latitud
        const url = `https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.routes && data.routes.length > 0) {
          // Extraemos y mapeamos [lon, lat] a [lat, lon] para Leaflet
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

      {/* Componente que conecta origen y destino mediante API OSRM */}
      <RoutingLine origin={origin || null} destination={destination || null} />
    </MapContainer>
  );
}