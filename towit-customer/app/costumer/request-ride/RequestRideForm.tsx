"use client";

import { useState } from "react";
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
  
  // Estados para el formulario inline de crear vehículo
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState("");
  
  // Estado para errores de validación
  const [formErrors, setFormErrors] = useState<{ origin?: string; destination?: string; vehicle?: string }>({});
  
  // Estado para la creación del viaje
  const [isRequesting, setIsRequesting] = useState(false);

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
      vehicleId: parseInt(selectedVehicleId, 10),
      craneType: selectedCraneType
    });

    setIsRequesting(false);

    if (result.error) {
      alert(result.error);
      return;
    }

    alert("¡Grúa solicitada exitosamente! Tu viaje ahora está en estado Pendiente.");
    // Aquí puedes redirigir al usuario a una pantalla de "Esperando grúa" o "Mis viajes"
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
      {/* Columna del Formulario */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-sm">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Ubicaciones con Autocompletado */}
          <div>
            <AddressSearch 
              id="origin" 
              label="Ubicación de Origen" 
              placeholder="Ej: Av. Siempreviva 742" 
              onSelect={(coords) => {
                setOrigin(coords);
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
              onSelect={(coords) => {
                setDestination(coords);
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
              <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-blue-700 text-sm font-medium text-center">
                Ingresá el Origen y Destino para ver los precios estimados
              </div>
            )}
          </div>

          <button disabled={isRequesting} type="submit" className="w-full px-6 py-4 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition text-xl duration-200 cursor-pointer flex justify-between items-center disabled:opacity-75 disabled:cursor-not-allowed">
            <span>{isRequesting ? "Procesando..." : "Confirmar y Buscar Grúa"}</span>
            {estimatedPrice > 0 && !isRequesting ? <span>{formatPrice(estimatedPrice)}</span> : null}
          </button>
        </form>
        
        {/* Formulario Oculto para creación de vehículo (usar form attribute previene submits anidados) */}
        <form id="add-vehicle-form" action={handleAddVehicle}></form>
      </div>

      {/* Columna del Mapa */}
      <div className="lg:flex items-center justify-center bg-gray-200 rounded-xl shadow-inner overflow-hidden h-96 lg:h-auto">
        <DynamicMap origin={origin} destination={destination} />
      </div>
    </div>
  );
}
