"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faCarSide, faPlus, faTruckPickup } from "@fortawesome/free-solid-svg-icons";
import { formatPrice } from "@/lib/utils";
import { CRANE_TYPES, CRANE_RATES } from "@/lib/constants";
import AddressSearch from "@/app/costumer/request-ride/map-components/AddressSearch";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  weight: number;
}

interface FormStepProps {
  origin: [number, number] | null;
  destination: [number, number] | null;
  onOriginSelect: (coords: [number, number], display_name?: string) => void;
  onDestinationSelect: (coords: [number, number], display_name?: string) => void;
  selectedVehicleId: string;
  onVehicleSelect: (id: string) => void;
  selectedCraneType: string;
  onCraneTypeSelect: (type: string) => void;
  formErrors: { origin?: string; destination?: string; vehicle?: string };
  onClearError: (field: "origin" | "destination" | "vehicle") => void;
  initialVehicles: Vehicle[];
  availableCraneTypes: string[];
  estimatedDistance: number;
  isRequesting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onAddVehicle: (formData: FormData) => Promise<{ error?: string; vehicle?: { vehicleId: number } }>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  selectedWeight: number;
}

export default function FormStep({
  origin,
  destination,
  onOriginSelect,
  onDestinationSelect,
  selectedVehicleId,
  onVehicleSelect,
  selectedCraneType,
  onCraneTypeSelect,
  formErrors,
  onClearError,
  initialVehicles,
  availableCraneTypes,
  estimatedDistance,
  isRequesting,
  onSubmit,
  onAddVehicle,
  isExpanded,
  onToggleExpand,
  onTouchStart,
  onTouchMove,
  selectedWeight,
}: FormStepProps) {
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  const handleAddVehicle = async (formData: FormData) => {
    setLoadingVehicle(true);
    setVehicleError("");
    const result = await onAddVehicle(formData);
    if (result?.error) {
      setVehicleError(result.error);
      setLoadingVehicle(false);
      return;
    }
    if (result?.vehicle) {
      onVehicleSelect(result.vehicle.vehicleId.toString());
    }
    setIsAddingVehicle(false);
    setLoadingVehicle(false);
  };

  const getCraneIcon = (key: string) => {
    if (key === "medium") return faCarSide;
    if (key === "large") return faTruckPickup;
    return null;
  };

  return (
    <>
      <h2 className="text-2xl font-extrabold text-foreground mb-6">Solicitá tu Grúa</h2>

      <form className="space-y-6" onSubmit={onSubmit}>
        {/* Origin */}
        <div>
          <AddressSearch
            id="origin"
            label="Ubicación de Origen"
            placeholder="Ej: Av. Siempreviva 742"
            onSelect={(coords, display_name) => {
              if (coords) onOriginSelect(coords, display_name);
              onClearError("origin");
            }}
          />
          {formErrors.origin && <p className="text-red-500 text-sm mt-1 font-medium">{formErrors.origin}</p>}
        </div>

        {/* Destination */}
        <div>
          <AddressSearch
            id="destination"
            label="Destino"
            placeholder="Ej: Bag End, Hobbiton, La Comarca"
            onSelect={(coords, display_name) => {
              if (coords) onDestinationSelect(coords, display_name);
              onClearError("destination");
            }}
          />
          {formErrors.destination && <p className="text-red-500 text-sm mt-1 font-medium">{formErrors.destination}</p>}
        </div>

        {/* Vehicle Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-lg font-bold text-foreground">
              Selecciona tu Vehículo
            </label>
          </div>
          {formErrors.vehicle && <p className="text-red-500 text-sm mb-3 font-medium">{formErrors.vehicle}</p>}

          {isAddingVehicle ? (
            <div className="p-5 border-2 border-border bg-card rounded-xl shadow-sm">
              <h4 className="text-md font-bold text-foreground mb-3">Registrar Nuevo Vehículo</h4>
              {vehicleError && <p className="text-red-500 mb-3 text-sm">{vehicleError}</p>}

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" name="brand" id="add-vehicle-form" required placeholder="Marca (Ej: Toyota)" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-foreground bg-card" />
                  <input type="text" name="model" id="add-vehicle-form" required placeholder="Modelo (Ej: Corolla)" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-foreground bg-card" />
                  <input type="number" name="year" id="add-vehicle-form" required placeholder="Año (Ej: 2020)" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-foreground bg-card" />
                  <input type="number" name="weight" id="add-vehicle-form" step="0.1" placeholder="Peso (Ton)" className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-foreground bg-card" />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setIsAddingVehicle(false)} className="px-3 py-1.5 text-sm text-muted-foreground font-medium hover:bg-muted rounded-lg transition cursor-pointer">Cancelar</button>
                  <button type="submit" form="add-vehicle-form" disabled={loadingVehicle} className="px-4 py-1.5 text-sm bg-brand-yellow text-black font-bold rounded-lg hover:bg-brand-yellow-hover transition disabled:opacity-50 cursor-pointer">
                    {loadingVehicle ? "Guardando..." : "Guardar y Seleccionar"}
                  </button>
                </div>
              </div>
            </div>
          ) : initialVehicles.length === 0 ? (
            <div className="p-6 border-2 border-dashed border-border rounded-xl text-center bg-card hover:border-border hover:bg-muted/50 transition">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <FontAwesomeIcon icon={faCar} className="text-xl text-brand-yellow-dark" />
              </div>
              <p className="text-muted-foreground mb-4 font-medium">No tienes vehículos registrados.</p>
              <button
                type="button"
                onClick={() => setIsAddingVehicle(true)}
                className="inline-block px-5 py-2.5 bg-brand-yellow text-black font-bold rounded-lg hover:bg-brand-yellow-hover transition cursor-pointer"
              >
                Registrar mi primer vehículo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {initialVehicles.map(v => (
                <label
                  key={v.id}
                  className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${
                    selectedVehicleId === v.id
                      ? "border-brand-yellow bg-brand-yellow/5"
                      : "border-gray-200 hover:border-brand-yellow bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="vehicle"
                    value={v.id}
                    checked={selectedVehicleId === v.id}
                    onChange={(e) => {
                      onVehicleSelect(e.target.value);
                      onClearError("vehicle");
                    }}
                    className="h-5 w-5 accent-gray-700 focus:ring-brand-yellow border-gray-300"
                  />
                  <div className="ml-4 flex-1">
                    <span                     className="block text-md font-bold text-foreground">{v.brand} {v.model}</span>
                    <span className="block text-sm text-muted-foreground mt-0.5 font-medium">Año: {v.year} • Peso: {v.weight} toneladas</span>
                  </div>
                </label>
              ))}
              <button
                type="button"
                onClick={() => setIsAddingVehicle(true)}
                className="w-full flex items-center justify-center p-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-brand-yellow hover:bg-brand-yellow/5 transition duration-200 bg-card"
              >
                <span className="text-muted-foreground font-semibold text-md flex items-center gap-2">
                  <FontAwesomeIcon icon={faPlus} className="text-lg" /> Registrar nuevo vehículo
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Crane Type */}
        <div>
          <label className="block text-lg font-bold text-foreground mb-3">Tipo de Grúa</label>
          {!selectedVehicleId ? (
            <div className="p-4 rounded-xl border border-border text-muted-foreground text-sm font-medium text-center">
              Seleccioná un vehículo para ver las opciones de grúa disponibles
            </div>
          ) : (
            <div className="space-y-3">
              {CRANE_TYPES.map(({ key, label, desc }) => {
                const available = availableCraneTypes.includes(key);
                const isSelected = selectedCraneType === key;
                const CraneIcon = getCraneIcon(key);

                if (!available) {
                  return (
                    <div key={key} className="flex items-center justify-between p-4 border-2 border-border rounded-xl bg-muted opacity-50">
                      <div className="flex items-center">
                        <div className="h-5 w-5 rounded-full border-2 border-border bg-muted" />
                        <div className="ml-4 flex items-center gap-3">
                          {CraneIcon ? (
                            <FontAwesomeIcon icon={CraneIcon} className="text-xl text-black" />
                          ) : (
                            <img src="/images/logo/tow2.svg" alt="Tow It" className="w-6 h-6 opacity-50" />
                          )}
                          <div>
                            <span className="block text-md font-bold text-muted-foreground">{label}</span>
                            <span className="block text-sm text-muted-foreground mt-0.5 font-medium">{desc}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-foreground font-medium">Supera el peso</span>
                    </div>
                  );
                }

                return (
                  <label
                    key={key}
                    className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${
                      isSelected ? "border-brand-yellow bg-brand-yellow/5" : "border-border hover:border-brand-yellow bg-card"
                    }`}
                  >
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="craneType"
                        value={key}
                        checked={isSelected}
                        onChange={() => onCraneTypeSelect(key)}
                        className="h-5 w-5 accent-gray-700 focus:ring-brand-yellow border-gray-300"
                      />
                      <div className="ml-4 flex items-center gap-3">
                        {CraneIcon ? (
                          <FontAwesomeIcon icon={CraneIcon} className={`text-xl ${isSelected ? "text-foreground" : "text-muted-foreground"}`} />
                        ) : (
                          <img src="/images/logo/tow2.svg" alt="Tow It" className={`w-6 h-6 ${isSelected ? "" : "opacity-60"}`} />
                        )}
                        <div>
                          <span className="block text-md font-bold text-foreground">{label}</span>
                          <span className="block text-sm text-muted-foreground mt-0.5 font-medium">{desc}</span>
                        </div>
                      </div>
                    </div>
                    {estimatedDistance > 0 ? (
                      <span className="font-bold text-foreground">
                        {formatPrice((CRANE_RATES[key as keyof typeof CRANE_RATES] || CRANE_RATES.medium).base + (CRANE_RATES[key as keyof typeof CRANE_RATES] || CRANE_RATES.medium).perKm * estimatedDistance)}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          )}

          {estimatedDistance > 0 ? (
            <div className="mt-4 p-4 bg-muted/80 rounded-xl flex justify-between items-center border border-border">
              <span className="text-muted-foreground font-medium">Distancia estimada</span>
              <span className="font-bold text-foreground">{estimatedDistance.toFixed(1)} km</span>
            </div>
          ) : selectedVehicleId ? (
            <div className="mt-4 p-4 rounded-xl border border-border text-muted-foreground text-sm font-medium text-center">
              Ingresá el Origen y Destino para ver los precios de tu remolque
            </div>
          ) : null}
        </div>

        <button
          disabled={isRequesting}
          type="submit"
          className="w-full mt-4 rounded-xl bg-brand-yellow py-4 text-[15px] font-bold text-black shadow-[0_2px_12px_rgba(245,197,24,0.3)] transition-all hover:bg-brand-yellow-hover active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer"
        >
          {isRequesting ? "Procesando..." : "Confirmar TowIt"}
        </button>
      </form>

      <form id="add-vehicle-form" action={handleAddVehicle} />
    </>
  );
}
