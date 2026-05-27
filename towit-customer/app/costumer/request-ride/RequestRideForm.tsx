"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DynamicMap from "@/app/costumer/request-ride/map-components/DynamicMap";
import AddressSearch from "@/app/costumer/request-ride/map-components/AddressSearch";
import { addVehicleAction } from "@/app/costumer/vehicles/actions";
import { createTripAction } from "@/app/costumer/request-ride/actions";

// Función para calcular distancia (Haversine) en km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

// Funciones Helper para enrutamiento animado
async function fetchOsrmRoute(start: [number, number], end: [number, number]) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]] as [number, number]
      );
    }
  } catch (e) {
    console.error("OSRM error:", e);
  }
  return [start, end]; 
}

function subsampleRoute(route: [number, number][], maxPoints: number) {
  if (route.length <= maxPoints) return route;
  const sampled: [number, number][] = [];
  for (let i = 0; i < maxPoints; i++) {
    const index = Math.floor((i / (maxPoints - 1)) * (route.length - 1));
    sampled.push(route[index]);
  }
  return sampled;
}

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
  const [isExpanded, setIsExpanded] = useState(true); // Control del arrastre en mobile
  
  // Variables para detectar gestos de swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStart;

    // Si desliza hacia abajo más de 40px
    if (diff > 40) {
      setIsExpanded(false);
      setTouchStart(null); // resetea
    }
    // Si desliza hacia arriba más de 40px
    else if (diff < -40) {
      setIsExpanded(true);
      setTouchStart(null); // resetea
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
  const [tripState, setTripState] = useState<'idle' | 'searching' | 'found' | 'in_progress' | 'completed'>('idle');
  const [towLocation, setTowLocation] = useState<[number, number] | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  const [originText, setOriginText] = useState<string>("");
  const [destinationText, setDestinationText] = useState<string>("");

  // Efecto para abrir el modal automáticamente cuando se completa el viaje
  useEffect(() => {
    if (tripState === 'completed' && !isExpanded) {
      setIsExpanded(true);
    }
  }, [tripState, isExpanded]);

  // Calcular precio estimado basado en origen, destino y tipo de grúa
  let estimatedDistance = 0;
  if (origin && destination) {
    estimatedDistance = calculateDistance(origin[0], origin[1], destination[0], destination[1]);
  }

  // Precios base y por km (ARS)
  const rates = {
    medium: { base: 12000, perKm: 1500 },
    large: { base: 15000, perKm: 1800 },
    conventional: { base: 18000, perKm: 2200 },
  };

  const currentRate = rates[selectedCraneType as keyof typeof rates] || rates.medium;
  const estimatedPrice = estimatedDistance > 0 
    ? currentRate.base + (currentRate.perKm * estimatedDistance) 
    : 0;
  
  // Función para formatear a ARS
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(price);
  };

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
      craneType: selectedCraneType
    });

    setIsRequesting(false);

    if (result.error) {
      alert(result.error);
      setIsRequesting(false);
      return;
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

    const pointsToOrigin = subsampleRoute(routeToOrigin, 20); // 20 pasos hasta origen
    const pointsToDest = subsampleRoute(routeToDest, 30);     // 30 pasos hasta destino

    // Fase 2: Encontrar la grúa luego de 3 segundos
    setTimeout(() => {
      setTripState('found');
      setEta(7); // 7 minutos mock inicial
      setTowLocation(pointsToOrigin[0]);

      // Fase 3: Animar la grúa acercándose al origen por la ruta
      let step1 = 0;
      const arriveInterval = setInterval(() => {
        step1++;
        if (step1 >= pointsToOrigin.length) {
          clearInterval(arriveInterval);
          // ¡Llegó al Origen!
          setTowLocation(origin);
          setTripState('in_progress');
          
          // Fase 4: Viajando hacia el destino por la ruta
          let step2 = 0;
          const toDestInterval = setInterval(() => {
            step2++;
            
            if (step2 >= pointsToDest.length) {
              clearInterval(toDestInterval);
              setTowLocation(destination);
              setTripState('completed');
            } else {
              setTowLocation(pointsToDest[step2]);
            }
          }, 800); // Actualiza la posición hacia destino cada 0.8s
          
        } else {
          // Grúa acercándose al origen
          setTowLocation(pointsToOrigin[step1]);
          setEta(Math.max(1, Math.floor(7 * (1 - step1 / pointsToOrigin.length)))); // Bajamos el ETA mock
        }
      }, 600); // 0.6s por tick de aproximación
    }, 3000);
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
          <Link href="/costumer/home" className="inline-flex items-center px-4 py-2 bg-white hover:bg-gray-100 text-gray-800 text-sm font-semibold rounded-[4px] transition-colors duration-200 shadow-[0_1px_5px_rgba(0,0,0,0.4)] border-2 border-[rgba(0,0,0,0.2)]" style={{ backgroundClip: 'padding-box' }}>
            <span className="mr-2 leading-none">←</span> Volver atrás
          </Link>
        </div>
      </div>

      {/* Mapa (Fondo absoluto en toda la pantalla) */}
      <div className="absolute inset-0 z-0 bg-gray-200">
        <DynamicMap origin={origin} destination={destination} towLocation={towLocation} />
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
                <h2 className="text-2xl font-extrabold text-black mb-6">Solicitá una Grúa</h2>
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
                    <input type="text" name="brand" form="add-vehicle-form" required placeholder="Marca (Ej: Toyota)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-yellow-400 focus:border-yellow-400 outline-none text-black" />
                    <input type="text" name="model" form="add-vehicle-form" required placeholder="Modelo (Ej: Corolla)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-yellow-400 focus:border-yellow-400 outline-none text-black" />
                    <input type="number" name="year" form="add-vehicle-form" required placeholder="Año (Ej: 2020)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-yellow-400 focus:border-yellow-400 outline-none text-black" />
                    <input type="number" name="weight" form="add-vehicle-form" step="0.1" placeholder="Peso (Ton)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-yellow-400 focus:border-yellow-400 outline-none text-black" />
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setIsAddingVehicle(false)} className="px-3 py-1.5 text-sm text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Cancelar</button>
                    <button type="submit" form="add-vehicle-form" disabled={loadingVehicle} className="px-4 py-1.5 text-sm bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition disabled:opacity-50">
                      {loadingVehicle ? "Guardando..." : "Guardar y Seleccionar"}
                    </button>
                  </div>
                </div>
              </div>
            ) : initialVehicles.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-gray-300 rounded-xl text-center bg-white hover:border-gray-400 hover:bg-gray-50/50 transition">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">🚗</span>
                </div>
                <p className="text-gray-600 mb-4 font-medium">No tienes vehículos registrados.</p>
                <button 
                  type="button"
                  onClick={() => setIsAddingVehicle(true)}
                  className="inline-block px-5 py-2.5 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition cursor-pointer"
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
                        ? 'border-yellow-400 bg-yellow-50/50' 
                        : 'border-gray-200 hover:border-yellow-400 bg-white'
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
                      className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-gray-300"
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
                  className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-yellow-400 hover:bg-yellow-50/30 transition duration-200 bg-white"
                >
                  <span className="text-gray-600 font-semibold text-md flex items-center gap-2">
                    <span className="text-xl leading-none mb-0.5">+</span> Registrar nuevo vehículo
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Tipo de Grúa */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-3">Tipo de Grúa</label>
            <div className="space-y-3">
              <label 
                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${selectedCraneType === 'medium' ? 'border-yellow-400 bg-yellow-50/50' : 'border-gray-200 hover:border-yellow-400 bg-white'}`}
              >
                <div className="flex items-center">
                  <input type="radio" name="craneType" value="medium" checked={selectedCraneType === 'medium'} onChange={() => setSelectedCraneType('medium')} className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-gray-300"/>
                  <div className="ml-4">
                    <span className="block text-md font-bold text-gray-900">Vehículo Mediano</span>
                    <span className="block text-sm text-gray-500 mt-0.5 font-medium">Autos, SUVs</span>
                  </div>
                </div>
                {estimatedDistance > 0 ? <span className="font-bold text-gray-900">{formatPrice(rates.medium.base + rates.medium.perKm * estimatedDistance)}</span> : null}
              </label>

              <label 
                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${selectedCraneType === 'large' ? 'border-yellow-400 bg-yellow-50/50' : 'border-gray-200 hover:border-yellow-400 bg-white'}`}
              >
                <div className="flex items-center">
                  <input type="radio" name="craneType" value="large" checked={selectedCraneType === 'large'} onChange={() => setSelectedCraneType('large')} className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-gray-300"/>
                  <div className="ml-4">
                    <span className="block text-md font-bold text-gray-900">Vehículo Grande</span>
                    <span className="block text-sm text-gray-500 mt-0.5 font-medium">Camionetas, Vans</span>
                  </div>
                </div>
                {estimatedDistance > 0 ? <span className="font-bold text-gray-900">{formatPrice(rates.large.base + rates.large.perKm * estimatedDistance)}</span> : null}
              </label>

              <label 
                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition duration-200 ${selectedCraneType === 'conventional' ? 'border-yellow-400 bg-yellow-50/50' : 'border-gray-200 hover:border-yellow-400 bg-white'}`}
              >
                <div className="flex items-center">
                  <input type="radio" name="craneType" value="conventional" checked={selectedCraneType === 'conventional'} onChange={() => setSelectedCraneType('conventional')} className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-gray-300"/>
                  <div className="ml-4">
                    <span className="block text-md font-bold text-gray-900">Grúa Convencional</span>
                    <span className="block text-sm text-gray-500 mt-0.5 font-medium">Arrastre estándar</span>
                  </div>
                </div>
                {estimatedDistance > 0 ? <span className="font-bold text-gray-900">{formatPrice(rates.conventional.base + rates.conventional.perKm * estimatedDistance)}</span> : null}
              </label>
            </div>
            
            {estimatedDistance > 0 ? (
              <div className="mt-4 p-4 bg-gray-100/80 rounded-xl flex justify-between items-center border border-gray-200">
                <span className="text-gray-600 font-medium">Distancia estimada</span>
                <span className="font-bold text-gray-800">{estimatedDistance.toFixed(1)} km</span>
              </div>
            ) : (
              <div className="mt-4 p-4 rounded-xl border text-gray-700 text-sm font-medium border border-gray-200">
                Ingresá el Origen y Destino para ver los precios de tu remolque
              </div>
            )}
          </div>

          <button disabled={isRequesting} type="submit" className="w-full mt-4 px-6 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-900 transition text-lg duration-200 cursor-pointer flex justify-center items-center shadow-md disabled:opacity-75 disabled:cursor-not-allowed">
            <span>{isRequesting ? "Procesando..." : "Confirmar TowIt"}</span>
          </button>
        </form>
        
        {/* Formulario Oculto para creación de vehículo (usar form attribute previene submits anidados) */}
        <form id="add-vehicle-form" action={handleAddVehicle}></form>
        </>
        ) : (
          <div className="h-full flex flex-col justify-center items-center text-center space-y-6 py-8">
            {tripState === 'searching' && (
              <div className="animate-pulse space-y-4">
                <div className="w-20 h-20 bg-yellow-300 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Buscando TowIt para tu remolque...</h3>
                <p className="text-gray-500 font-medium">Estamos conectando con los conductores de grúas cercanos.</p>
              </div>
            )}

            {tripState === 'found' && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto shadow-xl ring-4 ring-yellow-300">
                  <span className="text-3xl">🛻</span>
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
                    <span className="text-xl font-bold text-yellow-600">{eta} min</span>
                  </div>
                </div>
              </div>
            )}

            {tripState === 'in_progress' && (
              <div className="space-y-4">
                 <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                  <span className="text-3xl">🚗</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Grúa en camino a tu destino</h3>
                <p className="text-gray-500 font-medium">El conductor ya cargó tu vehículo y se dirige hacia el taller indicado.</p>
              </div>
            )}

            {tripState === 'completed' && (
              <div className="space-y-4">
                <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center mx-auto shadow-lg ring-4 ring-yellow-200">
                  <span className="text-5xl text-black font-medium">✓</span>
                </div>
                <h3 className="text-3xl font-bold text-gray-800">Viaje Finalizado</h3>
                <p className="text-gray-600 font-medium">Gracias por elegir nuestro servicio TowIt. Tu vehículo ha sido descargado con éxito.</p>
                <button onClick={() => window.location.reload()} className="mt-6 w-full px-6 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition shadow-md">
                  Solicitar otra grúa
                </button>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
    </div>
  );
}
