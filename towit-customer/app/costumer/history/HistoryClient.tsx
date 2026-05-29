"use client";

import { useState, useEffect } from "react";
import { geocodeAction } from "./actions";

// Caché global para no repetir peticiones a las mismas coordenadas
const addressCache = new Map<string, string>();

// Manejador de cola para respetar los límites
let geocodeQueue = Promise.resolve();

function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  if (addressCache.has(key)) {
    return Promise.resolve(addressCache.get(key)!);
  }

  return new Promise((resolve) => {
    geocodeQueue = geocodeQueue.then(async () => {
      try {
        const result = await geocodeAction(lat, lng);
        addressCache.set(key, result);
        resolve(result);
      } catch (e) {
        resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
      
      // Delay de 1 segundo para la cola
      await new Promise(r => setTimeout(r, 1000));
    });
  });
}

function AddressDisplay({ lat, lng }: { lat: number; lng: number }) {
  const [address, setAddress] = useState<string>(`Cargando dirección...`);

  useEffect(() => {
    let isMounted = true;
    
    reverseGeocode(lat, lng).then((result) => {
      if (isMounted) setAddress(result);
    });

    return () => { isMounted = false; };
  }, [lat, lng]);

  return <span>{address}</span>;
}

interface TowerInfo {
  tower_id: string;
  driver_name: string;
  driver_phone: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  driver_rating: number;
}

interface Trip {
  id: string;
  date: string;
  time: string;
  status: string;
  originChar?: string;
  DestinationChar?: string;
  vehicleBrand: string;
  vehicleModel: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  towerInfo: TowerInfo | null;
  tripRating: number | null;
  price: number | null;
}

export default function HistoryClient({ trips = [] }: { trips: Trip[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "finalizado":
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">Finalizado</span>;
      case "en proceso":
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">En proceso</span>;
      case "cancelado":
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">Cancelado</span>;
      case "pendiente pago":
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">Pendiente de pago</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-bold">{status}</span>;
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`text-lg ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}>★</span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
    } catch {
      return dateString;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Mis Viajes
        </h1>
        <p className="text-lg text-gray-600 mt-1">
          Consulta el historial de servicios de grúa que has solicitado.
        </p>
      </header>

      {trips.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📋</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">No tienes viajes aún</h3>
          <p className="text-gray-600 mb-6">Cuando solicites un remolque, aparecerá aquí.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-4">
          {trips.map((trip) => {
            const isExpanded = expandedId === trip.id;
            return (
              <div
                key={trip.id}
                className={`bg-white border-2 rounded-xl shadow-sm transition-all duration-200 ${
                  isExpanded ? "border-yellow-400" : "border-gray-200"
                }`}
              >
                {/* Header clickeable — solo resumen */}
                <div
                  onClick={() => toggleExpand(trip.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">🚗</span>
                      <span className="text-lg font-bold text-gray-900 truncate">
                        {trip.vehicleBrand} {trip.vehicleModel}
                      </span>
                    </div>
                    {trip.price !== null && (
                      <span className="text-lg font-bold text-green-700 shrink-0">{formatPrice(trip.price)}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-1.5">
                    <p className="text-xs text-gray-500 font-semibold">
                      {formatDate(trip.date)} — {trip.time.substring(0, 5)}hs
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(trip.status)}
                      <div className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalle expandible */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-1 border-t border-gray-100">
                    {/* Origen y destino conectados por línea */}
                    <div className="ml-2 flex flex-col">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <span className="w-3 h-3 bg-yellow-400 rounded-full shrink-0" />
                          <div className="w-0.5 h-10 bg-gray-300" />
                          <span className="w-3 h-3 bg-black rounded-full shrink-0" />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5 space-y-[34px]">
                          <p className="text-sm text-gray-800 leading-tight">
                            {trip.originChar && !trip.originChar.startsWith("Lat:") ? trip.originChar : <AddressDisplay lat={trip.originLat} lng={trip.originLng} />}
                          </p>
                          <p className="text-sm text-gray-800 leading-tight">
                            {trip.DestinationChar && !trip.DestinationChar.startsWith("Lat:") ? trip.DestinationChar : <AddressDisplay lat={trip.destinationLat} lng={trip.destinationLng} />}
                          </p>
                        </div>
                      </div>
                    </div>

                    {trip.towerInfo && (
                      <div className="mt-5 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-2">CONDUCTOR ASIGNADO</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center text-lg font-bold text-black shrink-0">
                            {trip.towerInfo.driver_name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{trip.towerInfo.driver_name}</p>
                            <p className="text-xs text-gray-500">{trip.towerInfo.vehicle_brand} {trip.towerInfo.vehicle_model} ({trip.towerInfo.vehicle_year})</p>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg shrink-0">
                            <span className="text-yellow-500 text-sm">★</span>
                            <span className="text-sm font-bold text-gray-800">{trip.towerInfo.driver_rating}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {trip.tripRating !== null && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-2">CALIFICACIÓN DEL VIAJE</p>
                        <div className="flex items-center gap-3">
                          {renderStars(trip.tripRating)}
                          <span className="text-sm font-bold text-gray-700">{trip.tripRating}/5</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}