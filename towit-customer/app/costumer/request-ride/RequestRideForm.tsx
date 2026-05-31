"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faCarSide, faPlus, faMagnifyingGlass, faTruckPickup, faTruck, faCircleCheck, faCircleXmark, faStar } from "@fortawesome/free-solid-svg-icons";
import { calculateDistance, fetchOsrmRoute, subsampleRoute, formatPrice } from "@/lib/utils";
import { WEIGHT_LIMITS, CRANE_RATES, CRANE_TYPES, ANIMATION_POINTS_TO_ORIGIN, ANIMATION_POINTS_TO_DEST, ANIMATION_INTERVAL_ARRIVE_MS, ANIMATION_INTERVAL_TO_DEST_MS, SEARCH_DELAY_MS, MOCK_ETA_MINUTES } from "@/lib/constants";
import BackButton from "@/components/ui/BackButton";
import DynamicMap from "@/app/costumer/request-ride/map-components/DynamicMap";
import AddressSearch from "@/app/costumer/request-ride/map-components/AddressSearch";
import { addVehicleAction } from "@/app/costumer/vehicles/actions";
import { createTripAction, cancelTripAction, finishTripAction, submitFeedbackAction } from "@/app/costumer/request-ride/actions";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  weight: number;
}

export default function RequestRideForm({ initialVehicles = [] }: { initialVehicles?: Vehicle[] }) {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");
  const [selectedCraneType, setSelectedCraneType] = useState<string>("medium");
  const [isExpanded, setIsExpanded] = useState(true);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;

    if (diff > 40) {
      setIsExpanded(false);
      setTouchStart(null); 
    }

    else if (diff < -40) {
      setIsExpanded(true);
      setTouchStart(null); 
    }
  };

  // Estados para el formulario inline de crear vehículo
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState("");
  
  // Estado para errores de validación
  const [formErrors, setFormErrors] = useState<{ origin?: string; destination?: string; vehicle?: string }>({});
  
  // Estado para la creación y simulación del viaje
  const [isRequesting, setIsRequesting] = useState(false);
  const [tripState, setTripState] = useState<'idle' | 'searching' | 'found' | 'in_progress' | 'completed' | 'cancelled'>('idle');
  const [towLocation, setTowLocation] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  const [originText, setOriginText] = useState<string>("");
  const [destinationText, setDestinationText] = useState<string>("");

  // Guardamos el ID del viaje activo para poder cancelarlo después
  const [currentTripId, setCurrentTripId] = useState<number | null>(null);
  
  // Estados para feedback post-viaje
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  
  // Guardamos referencias a las animaciones para poder cortarlas si se cancela
  const intervalsRef = useRef<{ arrive?: NodeJS.Timeout, toDest?: NodeJS.Timeout }>({});

  // Efecto para abrir el modal automáticamente cuando se completa o cancela el viaje
  useEffect(() => {
    if ((tripState === 'completed' || tripState === 'cancelled') && !isExpanded) {
      setIsExpanded(true);
    }
  }, [tripState, isExpanded]);

  // Calcular precio estimado basado en origen, destino y tipo de grúa
  let estimatedDistance = 0;
  if (origin && destination) {
    estimatedDistance = calculateDistance(origin[0], origin[1], destination[0], destination[1]);
  }

  const weightLimits = WEIGHT_LIMITS;

  const selectedVehicle = initialVehicles.find(v => v.id === selectedVehicleId);
  const selectedWeight = selectedVehicle?.weight ?? 0;

  const availableCraneTypes = (Object.keys(weightLimits) as Array<keyof typeof weightLimits>).filter(
    type => selectedWeight <= weightLimits[type]
  );

  // Auto-switch si el tipo actual no es compatible
  useEffect(() => {
    if (selectedVehicleId && availableCraneTypes.length > 0 && !availableCraneTypes.includes(selectedCraneType as keyof typeof weightLimits)) {
      setSelectedCraneType(availableCraneTypes[0]);
    }
  }, [selectedVehicleId, selectedWeight]);

  const rates = CRANE_RATES;

  const currentRate = rates[selectedCraneType as keyof typeof CRANE_RATES] || rates.medium;
  const estimatedPrice = estimatedDistance > 0 
    ? currentRate.base + (currentRate.perKm * estimatedDistance) 
    : 0;
  
  // formatPrice imported from lib/utils

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { origin?: string; destination?: string; vehicle?: string } = {};
    
    if (!origin) errors.origin = "Debes seleccionar una ubicación de origen";
    if (!destination) errors.destination = "Debes seleccionar un destino";
    if (!selectedVehicleId) errors.vehicle = "Debes seleccionar o registrar un vehículo";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormErrors({});
    setIsRequesting(true);

    const result = await createTripAction({
      originLat: origin![0],
      originLng: origin![1],
      destinationLat: destination![0],
      destinationLng: destination![1],
      originText: originText,
      destinationText: destinationText,
      vehicleId: parseInt(selectedVehicleId, 10),
      craneType: selectedCraneType,
      estimatedPrice: estimatedPrice
    });

    setIsRequesting(false);

    if (result.error) {
      alert(result.error);
      setIsRequesting(false);
      return;
    }

    let createdTripId: number | null = null;
    if (result.trip) {
      createdTripId = result.trip.tripId;
      setCurrentTripId(createdTripId);
    }

    // Comenzar el flujo Mockeado de simulación (estilo Uber)
    setTripState('searching');
    setIsRequesting(false); // Liberamos el botón internamente aunque ocultaremos el form

    // Fase 1: Precargar rutas reales usando OSRM
    const fakeStartLat = origin![0] + 0.015;
    const fakeStartLng = origin![1] + 0.015;
    const fakeStart: [number, number] = [fakeStartLat, fakeStartLng];

    const routeToOrigin = await fetchOsrmRoute(fakeStart, origin!);
    const routeToDest = await fetchOsrmRoute(origin!, destination!);

    const pointsToOrigin = subsampleRoute(routeToOrigin, ANIMATION_POINTS_TO_ORIGIN);
    const pointsToDest = subsampleRoute(routeToDest, ANIMATION_POINTS_TO_DEST);

    setTimeout(() => {
      setTripState('found');
      setEta(MOCK_ETA_MINUTES);
      setTowLocation(pointsToOrigin[0]);

      // Fase 3: Animar la grúa acercándose al origen por la ruta
      let step1 = 0;
      intervalsRef.current.arrive = setInterval(() => {
        step1++;
        if (step1 >= pointsToOrigin.length) {
          clearInterval(intervalsRef.current.arrive);
          // ¡Llegó al Origen!
          setTowLocation(origin);
          setTripState('in_progress');
          
          // Fase 4: Viajando hacia el destino por la ruta
          let step2 = 0;
          intervalsRef.current.toDest = setInterval(() => {
            step2++;
            
            if (step2 >= pointsToDest.length) {
              clearInterval(intervalsRef.current.toDest);
              setTowLocation(destination);
              setTripState('completed');
              
              // Actualizamos el estado a finalizado en la base de datos
              if (createdTripId) {
                finishTripAction(createdTripId).catch(console.error);
              }
            } else {
              setTowLocation(pointsToDest[step2]);
            }
          }, ANIMATION_INTERVAL_TO_DEST_MS);

          
        } else {
          // Grúa acercándose al origen
          setTowLocation(pointsToOrigin[step1]);
          setEta(Math.max(1, Math.floor(7 * (1 - step1 / pointsToOrigin.length)))); // Bajamos el ETA mock
        }
      }, ANIMATION_INTERVAL_ARRIVE_MS);
    }, SEARCH_DELAY_MS);
  };

  const handleCancelTrip = async () => {
    if (!currentTripId) return;

    if (intervalsRef.current.arrive) clearInterval(intervalsRef.current.arrive);
    if (intervalsRef.current.toDest) clearInterval(intervalsRef.current.toDest);

    setIsRequesting(true); // Re-usamos loading
    
    // Llamar a la acción para cancelar viaje (avisa a Payments y Tower App)
    const res = await cancelTripAction(currentTripId);
    
    setIsRequesting(false);
    
    if (res.error) {
      alert("Error al cancelar: " + res.error);
      return;
    }

    setTripState('cancelled');
    setTowLocation(null);
    setCurrentTripId(null);
    setEta(null);
  };

  const handleAddVehicle = async (formData: FormData) => {
    setLoadingVehicle(true);
    setVehicleError("");
    
    const result = await addVehicleAction(formData);

    if (result?.error) {
      setVehicleError(result.error);
      setLoadingVehicle(false);
      return;
    }

    // Al revalidar el path, los nuevos vehículos bajan por prop.
    // Además, seteamos el ID del vehículo recién creado para que quede seleccionado
    if (result?.vehicle) {
      setSelectedVehicleId(result.vehicle.vehicleId.toString());
    }
    
    setIsAddingVehicle(false);
    setLoadingVehicle(false);
  };

  return (
    <div className="absolute inset-0 w-full h-full">
      <div className="absolute top-0 left-0 w-full z-[1000] pointer-events-none">
        <div className="absolute top-[10px] left-[10px] lg:left-[calc(450px+10px)] xl:left-[calc(500px+10px)] pointer-events-auto">
          <BackButton />
        </div>
      </div>

      {/* Mapa (Fondo absoluto en toda la pantalla) */}
      <div className="absolute inset-0 z-0 bg-gray-200">
        <DynamicMap origin={origin} destination={destination} towLocation={towLocation} craneType={selectedCraneType} />
      </div>

      {/* Panel Frontal Flotante */}
      <div 
        className={`absolute bottom-0 left-0 right-0 lg:right-auto lg:left-0 lg:top-0 lg:h-full lg:w-[450px] xl:w-[500px] bg-white z-10 rounded-t-3xl lg:rounded-none shadow-[0_-10px_40px_rgba(0,0,0,0.15)] lg:shadow-[10px_0_40px_rgba(0,0,0,0.1)] flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'h-[65vh]' : 'h-[8vh] lg:h-full'}`}
      >
        {/* Indicador de drag en celular (el "palito" fijo que no scrollea) */}
        <div 
          className="w-full h-10 flex-none flex justify-center items-center cursor-pointer lg:hidden z-20"
          onClick={() => setIsExpanded(!isExpanded)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          <div className="w-12 h-1.5 bg-gray-300 rounded-full pointer-events-none"></div>
        </div>

        {/* Contenedor INTERNO con scroll */}
        <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-6 pb-6 lg:pt-6 ${!isExpanded ? 'hidden lg:block' : 'block'}`}>
          <div className="relative min-h-max flex flex-col">
            {tripState === 'idle' ? (
              <>
                <h2 className="text-2xl font-extrabold text-black mb-6">Solicitá tu Grúa</h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Ubicaciones con Autocompletado */}
          <div>
            <AddressSearch 
              id="origin" 
              label="Ubicación de Origen" 
              placeholder="Ej: Av. Siempreviva 742" 
              onSelect={(coords, display_name) => {
                setOrigin(coords);
                setOriginText(display_name || "");
                setFormErrors(prev => ({ ...prev, origin: undefined }));
              }} 
            />
            {formErrors.origin && <p className="text-red-500 text-sm mt-1 font-medium">{formErrors.origin}</p>}
          </div>

          <div>
            <AddressSearch 
              id="destination" 
              label="Destino" 
              placeholder="Ej: Taller Mecánico 'El Rápido'" 
              onSelect={(coords, display_name) => {
                setDestination(coords);
                setDestinationText(display_name || "");
                setFormErrors(prev => ({ ...prev, destination: undefined }));
              }} 
            />
            {formErrors.destination && <p className="text-red-500 text-sm mt-1 font-medium">{formErrors.destination}</p>}
          </div>

          {/* Datos del Vehículo */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-lg font-bold text-gray-800">
                Selecciona tu Vehículo
              </label>
            </div>
            {formErrors.vehicle && <p className="text-red-500 text-sm mb-3 font-medium">{formErrors.vehicle}</p>}
            
            {isAddingVehicle ? (
              <div className="p-5 border-2 border-gray-200 bg-white rounded-xl shadow-sm">
                <h4 className="text-md font-bold text-gray-800 mb-3">Registrar Nuevo Vehículo</h4>
                {vehicleError && <p className="text-red-500 mb-3 text-sm">{vehicleError}</p>}
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" name="brand" form="add-vehicle-form" required placeholder="Marca (Ej: Toyota)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-black" />
                    <input type="text" name="model" form="add-vehicle-form" required placeholder="Modelo (Ej: Corolla)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-black" />
                    <input type="number" name="year" form="add-vehicle-form" required placeholder="Año (Ej: 2020)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-black" />
                    <input type="number" name="weight" form="add-vehicle-form" step="0.1" placeholder="Peso (Ton)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-brand-yellow focus:border-brand-yellow outline-none text-black" />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddingVehicle(false)} className="px-3 py-1.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                    <button type="submit" form="add-vehicle-form" disabled={loadingVehicle} className="px-4 py-1.5 text-sm bg-brand-yellow text-black font-bold rounded-lg hover:bg-brand-yellow-hover transition disabled:opacity-50 cursor-pointer">
                      {loadingVehicle ? "Guardando..." : "Guardar y Seleccionar"}
                    </button>
                  </div>
                </div>
              </div>
            ) : initialVehicles.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center bg-white hover:border-gray-400 hover:bg-gray-50/50 transition">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FontAwesomeIcon icon={faCar} className="text-xl text-brand-yellow-dark" />
                </div>
                <p className="text-gray-600 mb-4 font-medium">No tienes vehículos registrados.</p>
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
 ? 'border-brand-yellow bg-brand-yellow/5' 
                      : 'border-gray-200 hover:border-brand-yellow bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="vehicle"
                      value={v.id}
                      checked={selectedVehicleId === v.id}
                      onChange={(e) => {
                        setSelectedVehicleId(e.target.value);
                        setFormErrors(prev => ({ ...prev, vehicle: undefined }));
                      }}
className="h-5 w-5 accent-gray-700 focus:ring-brand-yellow border-gray-300"
                    />
                    <div className="ml-4 flex-1">
                      <span className="block text-md font-bold text-gray-900">{v.brand} {v.model}</span>
                      <span className="block text-sm text-gray-500 mt-0.5 font-medium">Año: {v.year} • Peso: {v.weight} toneladas</span>
                    </div>
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setIsAddingVehicle(true)}
                  className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-yellow hover:bg-brand-yellow/5 transition duration-200 bg-white"
                >
                  <span className="text-gray-600 font-semibold text-md flex items-center gap-2">
                    <FontAwesomeIcon icon={faPlus} className="text-lg" /> Registrar nuevo vehículo
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Tipo de Grúa */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">Tipo de Grúa</label>
            {!selectedVehicleId ? (
              <div className="p-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium text-center">
                Seleccioná un vehículo para ver las opciones de grúa disponibles
              </div>
            ) : (
            <div className="space-y-3">
              {CRANE_TYPES.map(({ key, label, desc }) => {
                const available = availableCraneTypes.includes(key);
                const isSelected = selectedCraneType === key;

                const CraneIcon = key === "medium" ? faCarSide : key === "large" ? faTruckPickup : null;

                if (!available) {
                  return (
                    <div key={key} className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl bg-gray-50 opacity-50">
                      <div className="flex items-center">
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300 bg-gray-100" />
                        <div className="ml-4 flex items-center gap-3">
                          {CraneIcon ? (
                            <FontAwesomeIcon icon={CraneIcon} className="text-xl text-black" />
                          ) : (
                            <img src="/images/logo/tow1.svg" alt="Tow It" className="w-6 h-6 opacity-50" />
                          )}
                          <div>
                            <span className="block text-md font-bold text-gray-400">{label}</span>
                            <span className="block text-sm text-gray-400 mt-0.5 font-medium">{desc}</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-black font-medium">Supera el peso</span>
                    </div>
                  );
                }

                return (
                  <label key={key} className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${isSelected ? 'border-brand-yellow bg-brand-yellow/5' : 'border-gray-200 hover:border-brand-yellow bg-white'}`}>
                    <div className="flex items-center">
                      <input type="radio" name="craneType" value={key} checked={isSelected} onChange={() => setSelectedCraneType(key)} className="h-5 w-5 accent-gray-700 focus:ring-brand-yellow border-gray-300"/>
                      <div className="ml-4 flex items-center gap-3">
                        {CraneIcon ? (
                          <FontAwesomeIcon icon={CraneIcon} className={`text-xl ${isSelected ? 'text-black' : 'text-gray-500'}`} />
                        ) : (
                          <img src="/images/logo/tow2.svg" alt="Tow It" className={`w-6 h-6 ${isSelected ? '' : 'opacity-60'}`} />
                        )}
                        <div>
                          <span className="block text-md font-bold text-gray-900">{label}</span>
                          <span className="block text-sm text-gray-500 mt-0.5 font-medium">{desc}</span>
                        </div>
                      </div>
                    </div>
                    {estimatedDistance > 0 ? <span className="font-bold text-gray-900">{formatPrice(rates[key].base + rates[key].perKm * estimatedDistance)}</span> : null}
                  </label>
                );
              })}
            </div>
            )}
            
            {estimatedDistance > 0 ? (
              <div className="mt-4 p-4 bg-gray-100/80 rounded-xl flex justify-between items-center border border-gray-200">
                <span className="text-gray-600 font-medium">Distancia estimada</span>
                <span className="font-bold text-gray-800">{estimatedDistance.toFixed(1)} km</span>
              </div>
            ) : selectedVehicleId ? (
              <div className="mt-4 p-4 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium text-center">
                Ingresá el Origen y Destino para ver los precios de tu remolque
              </div>
            ) : null}
          </div>

          <button disabled={isRequesting} type="submit" className="w-full mt-4 rounded-xl bg-brand-yellow py-4 text-[15px] font-bold text-black shadow-[0_2px_12px_rgba(245,197,24,0.3)] transition-all hover:bg-brand-yellow-hover active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer">
            {isRequesting ? "Procesando..." : "Confirmar TowIt"}
          </button>
        </form>
        
        {/* Formulario Oculto para creación de vehículo (usar form attribute previene submits anidados) */}
        <form id="add-vehicle-form" action={handleAddVehicle}></form>
        </>
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-8">
            {tripState === 'searching' && (
              <div className="animate-pulse space-y-4">
                <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Buscando TowIt para tu remolque...</h3>
                <p className="text-gray-500 font-medium">Estamos conectando con los conductores de grúas cercanos.</p>
              </div>
            )}

            {tripState === 'found' && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto shadow-xl ring-4 ring-brand-yellow">
                  <FontAwesomeIcon icon={faTruckPickup} className="text-3xl text-brand-yellow" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">¡TowIt Encontrado!</h3>
                <div className="bg-white p-4 rounded-xl border border-gray-200 text-left w-full shadow-sm">
                  <p className="text-sm text-gray-500 font-semibold mb-1">CONDUCTOR</p>
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-gray-900">Pablo • Grúa {selectedCraneType === "large" ? "Pesada" : "Mediana"}</p>
                    <div className="bg-gray-100 px-3 py-1 rounded-full"><span className="font-bold text-gray-800">★ 4.9</span></div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Llegando en</span>
                    <span className="text-xl font-bold text-brand-yellow-dark">{eta} min</span>
                  </div>
                </div>
              </div>
            )}

            {tripState === 'in_progress' && (
              <div className="space-y-4">
                 <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <FontAwesomeIcon icon={faTruck} className="text-3xl text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Grúa en camino a tu destino</h3>
                <p className="text-gray-500 font-medium">El conductor ya cargó tu vehículo y se dirige hacia el taller indicado.</p>
              </div>
            )}

            {tripState === 'completed' && !feedbackSubmitted && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-brand-yellow rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-brand-yellow/30">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-5xl text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Viaje Finalizado</h3>
                <p className="text-gray-600 font-medium">Tu vehículo llegó a destino. Calificá el servicio para finalizar.</p>

                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mt-4">
                  <p className="text-lg font-bold text-gray-800 mb-4">Calificá el servicio</p>
                  <div className="flex justify-center gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <FontAwesomeIcon key={s} icon={faStar} className="text-4xl text-brand-yellow" />
                    ))}
                  </div>
                  <button
                    onClick={async () => {
                      if (!currentTripId) return;
                      setFeedbackLoading(true);
                      const res = await submitFeedbackAction({
                        tripId: currentTripId,
                        rating: 5,
                        comment: ""
                      });
                      setFeedbackLoading(false);
                      if (res.success) {
                        setFeedbackSubmitted(true);
                      } else {
                        alert("Error al enviar calificación: " + (res.error || "desconocido"));
                      }
                    }}
                    disabled={feedbackLoading}
                    className="w-full px-6 py-3 bg-brand-yellow text-black font-bold rounded-xl hover:bg-brand-yellow-hover transition text-lg duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feedbackLoading ? "Enviando..." : <>Enviar Calificación <FontAwesomeIcon icon={faStar} className="ml-1" /></>}
                  </button>
                </div>
              </div>
            )}

            {tripState === 'completed' && feedbackSubmitted && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-green-200">
                  <FontAwesomeIcon icon={faCircleCheck} className="text-5xl text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Calificación enviada</h3>
                <div className="flex justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FontAwesomeIcon key={s} icon={faStar} className="text-3xl text-brand-yellow" />
                  ))}
                </div>
                <p className="text-gray-600 font-medium">Gracias por tu calificación. ¡Esperamos verte de nuevo!</p>
                <Link href="/costumer/home" className="w-full block">
                  <button className="w-full px-6 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition text-lg duration-200 shadow-md cursor-pointer">
                    Volver al inicio
                  </button>
                </Link>
                <button onClick={() => window.location.reload()} className="w-full px-6 py-4 border-2 border-black text-black font-bold rounded-xl hover:bg-gray-100 transition text-lg duration-200 cursor-pointer">
                  Solicitar otro viaje
                </button>
              </div>
            )}

            {tripState === 'cancelled' && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-red-50">
                  <FontAwesomeIcon icon={faCircleXmark} className="text-4xl text-red-500" />
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Viaje Cancelado</h3>
                <p className="text-gray-600 font-medium">El viaje fue cancelado y se solicitó el reembolso correspondiente.</p>
                <button onClick={() => window.location.reload()} className="mt-6 w-full px-6 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-md">
                  Solicitar otra grúa
                </button>
              </div>
            )}

            {/* Botón de Cancelar viaje - ocultarlo si ya llegó al origen (in_progress) */}
            {(tripState === 'searching' || tripState === 'found') && (
              <button
                onClick={handleCancelTrip}
                disabled={isRequesting}
                className="w-full mt-auto py-3 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-lg border border-red-300 transition text-md duration-200 disabled:opacity-50"
              >
                {isRequesting ? "Cancelando..." : "Cancelar Viaje"}
              </button>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
    </div>
  );
}
