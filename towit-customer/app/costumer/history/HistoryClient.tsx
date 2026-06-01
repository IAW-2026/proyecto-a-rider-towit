"use client";

import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faClipboardList, faChevronDown, faStar } from "@fortawesome/free-solid-svg-icons";
import { formatPrice, formatDate } from "@/lib/utils";
import { StarRatingDisplay } from "@/components/ui/StarRating";
import { geocodeAction } from "./actions";

const addressCache = new Map<string, string>();
let geocodeQueue = Promise.resolve();

function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  if (addressCache.has(key)) return Promise.resolve(addressCache.get(key)!);
  return new Promise((resolve) => {
    geocodeQueue = geocodeQueue.then(async () => {
      try {
        const result = await geocodeAction(lat, lng);
        addressCache.set(key, result);
        resolve(result);
      } catch {
        resolve(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
      await new Promise(r => setTimeout(r, 1000));
    });
  });
}

function AddressDisplay({ lat, lng }: { lat: number; lng: number }) {
  const [address, setAddress] = useState("Cargando...");
  useEffect(() => {
    let mounted = true;
    reverseGeocode(lat, lng).then(r => { if (mounted) setAddress(r); });
    return () => { mounted = false; };
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

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  finalizado:       { label: "Finalizado",        className: "bg-muted text-muted-foreground" },
  "en proceso":     { label: "En proceso",         className: "bg-brand-yellow/20 text-brand-yellow-dark" },
  cancelado:        { label: "Cancelado",          className: "bg-muted text-muted-foreground" },
  "pendiente pago": { label: "Pendiente de pago",  className: "bg-brand-yellow/15 text-brand-yellow-dark" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status.toLowerCase()] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${s.className}`}>
      {s.label}
    </span>
  );
}

export default function HistoryClient({ trips = [] }: { trips: Trip[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="bg-background text-foreground" style={{ fontFamily: "'Geist', sans-serif" }}>
      <div className="mx-auto max-w-2xl px-4 py-0 sm:px-6 sm:py-0">

        {/* Header */}
        <header className="mb-6 sm:mb-10">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-yellow-dark">
            Historial
          </p>
          <h1 className="text-[28px] font-extrabold tracking-[-1px] leading-tight text-foreground sm:text-[38px] sm:tracking-[-1.5px]">
            Mis viajes
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground sm:text-[16px]">
            Todos los servicios de grúa que solicitaste.
          </p>
        </header>

        {/* Empty state */}
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow/10">
              <FontAwesomeIcon icon={faClipboardList} className="h-6 w-6 text-brand-yellow-dark" />
            </div>
            <p className="mb-1 text-[15px] font-bold text-foreground">Todavía no tenés viajes</p>
            <p className="text-[13px] text-muted-foreground">Cuando solicites un remolque, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {trips.map((trip) => {
              const isExpanded = expandedId === trip.id;
              return (
                <div
                  key={trip.id}
                  className={`overflow-hidden rounded-2xl bg-card transition-all duration-200 ${
                    isExpanded
                      ? "shadow-[0_4px_24px_rgba(245,197,24,0.15)] ring-1 ring-brand-yellow"
                      : "shadow-sm ring-1 ring-border active:bg-muted"
                  }`}
                >
                  {/* Summary row — tap target generoso */}
                  <button
                    type="button"
                    onClick={() => toggle(trip.id)}
                    aria-expanded={isExpanded}
                    aria-label={`${trip.vehicleBrand} ${trip.vehicleModel}, ${trip.status}, ${formatDate(trip.date)}. ${isExpanded ? "Colapsar" : "Expandir"} detalles`}
                    className="flex w-full text-left cursor-pointer select-none items-center gap-3 px-4 py-3.5"
                  >
                    {/* Icon */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isExpanded ? "bg-brand-yellow/15" : "bg-muted"
                    }`}>
                      <FontAwesomeIcon
                        icon={faCar}
                        className={`h-4 w-4 ${isExpanded ? "text-brand-yellow-dark" : "text-gray-500"}`}
                      />
                    </div>

                    {/* Middle: vehicle + date + status */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-bold text-foreground">
                          {trip.vehicleBrand} {trip.vehicleModel}
                        </p>
                        <StatusBadge status={trip.status} />
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {formatDate(trip.date)} · {trip.time.substring(0, 5)}hs
                      </p>
                    </div>

                    {/* Right: price + chevron */}
                    <div className="flex shrink-0 items-center gap-2">
                      {trip.price !== null && (
                        <div className="text-right">
                          <span className="text-[14px] font-bold text-foreground">
                            {formatPrice(trip.price)}
                          </span>
                          {trip.status === "cancelado" && (
                            <p className="text-[10px] font-semibold text-muted-foreground leading-tight">Reembolso</p>
                          )}
                        </div>
                      )}
                      <FontAwesomeIcon
                        icon={faChevronDown}
                        className={`h-3 w-3 text-gray-500 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-5 pt-4 space-y-5">

                      {/* Route */}
                      <div className="flex gap-3">
                        {/* Vertical timeline */}
                        <div className="flex flex-col items-center pt-0.5 shrink-0">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: 'white', border: '4px solid black' }} />
                          <div className="my-1 w-px flex-1 border-l-2 border-dashed border-border" style={{ minHeight: 32 }} />
                          <div className="h-4 w-4" style={{ backgroundColor: 'white', border: '4px solid black' }} />
                        </div>

                        {/* Addresses */}
                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                          <div>
                            <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Origen</p>
                            <p className="text-[13px] leading-snug text-foreground/80">
                              {trip.originChar && !trip.originChar.startsWith("Lat:")
                                ? trip.originChar
                                : <AddressDisplay lat={trip.originLat} lng={trip.originLng} />}
                            </p>
                          </div>
                          <div>
                            <span className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Destino</span>
                            <p className="text-[13px] leading-snug text-foreground/80">
                              {trip.DestinationChar && !trip.DestinationChar.startsWith("Lat:")
                                ? trip.DestinationChar
                                : <AddressDisplay lat={trip.destinationLat} lng={trip.destinationLng} />}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Conductor */}
                      {trip.towerInfo && (
                        <div className="border-t border-border pt-4">
                          <p className="mb-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            Conductor
                          </p>
                          <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-[14px] font-extrabold text-black">
                              {trip.towerInfo.driver_name.charAt(0)}
                            </div>
                            {/* Info */}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-foreground">
                                {trip.towerInfo.driver_name}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {trip.towerInfo.vehicle_brand} {trip.towerInfo.vehicle_model} · {trip.towerInfo.vehicle_year}
                              </p>
                            </div>
                            {/* Rating chip */}
                            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border bg-muted px-2.5 py-1">
                              <FontAwesomeIcon icon={faStar} className="h-2.5 w-2.5 text-brand-yellow" />
                              <span className="text-[12px] font-bold text-foreground">
                                {trip.towerInfo.driver_rating}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Trip rating */}
                      {trip.tripRating !== null && (
                        <div className="border-t border-border pt-4">
                          <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            Tu calificación
                          </p>
                          <div className="flex items-center gap-2.5">
                            <StarRatingDisplay rating={trip.tripRating} />
                            <span className="text-[12px] font-bold text-muted-foreground">{trip.tripRating}/5</span>
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
      </div>
    </div>
  );
}
