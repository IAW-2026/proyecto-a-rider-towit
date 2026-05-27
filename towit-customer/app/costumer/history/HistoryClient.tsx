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
}

export default function HistoryClient({ trips = [] }: { trips: Trip[] }) {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">Completado</span>;
      case "in_progress":
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">En curso</span>;
      case "cancelled":
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-bold">Cancelado</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-bold">{status}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
    } catch {
      return dateString;
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white border-2 border-gray-200 rounded-xl p-6 shadow flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-500 font-semibold mb-1">
                    {formatDate(trip.date)} a las {trip.time.substring(0, 5)}hs
                  </p>
                  <h4 className="text-lg font-bold text-gray-900 mt-1">
                    {trip.vehicleBrand} {trip.vehicleModel}
                  </h4>
                </div>
                <div>
                  {getStatusBadge(trip.status)}
                </div>
              </div>
              
              <div className="mt-4 flex-1">
                <div className="relative pl-6 pb-6 border-l-2 border-gray-200 ml-2">
                  <div className="absolute w-3 h-3 bg-yellow-400 rounded-full -left-[7px] top-1"></div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">ORIGEN</p>
                  <p className="text-sm text-gray-800">
                    {trip.originChar && !trip.originChar.startsWith("Lat:") ? trip.originChar : <AddressDisplay lat={trip.originLat} lng={trip.originLng} />}
                  </p>
                </div>
                <div className="relative pl-6 ml-2">
                  <div className="absolute w-3 h-3 bg-black rounded-full -left-[7px] top-1"></div>
                  <p className="text-sm font-semibold text-gray-500 mb-1">DESTINO</p>
                  <p className="text-sm text-gray-800">
                    {trip.DestinationChar && !trip.DestinationChar.startsWith("Lat:") ? trip.DestinationChar : <AddressDisplay lat={trip.destinationLat} lng={trip.destinationLng} />}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}