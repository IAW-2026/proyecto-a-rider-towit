"use client";

import { useState } from "react";
import DynamicMap from "@/app/costumer/request-ride/map-components/DynamicMap";
import AddressSearch from "@/app/costumer/request-ride/map-components/AddressSearch";
import { addVehicleAction } from "@/app/costumer/vehicles/actions";

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
  
  // Estados para el formulario inline de crear vehículo
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [loadingVehicle, setLoadingVehicle] = useState(false);
  const [vehicleError, setVehicleError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      alert("Por favor selecciona correctamente el origen y el destino desde las sugerencias.");
      return;
    }
    if (!selectedVehicleId) {
      alert("Por favor selecciona un vehículo.");
      return;
    }
    alert("¡Buscando grúa! (Funcionalidad simulada)");
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
          <AddressSearch 
            id="origin" 
            label="Ubicación de Origen" 
            placeholder="Ej: Av. Siempreviva 742" 
            onSelect={setOrigin} 
          />
          <AddressSearch 
            id="destination" 
            label="Destino" 
            placeholder="Ej: Taller Mecánico 'El Rápido'" 
            onSelect={setDestination} 
          />

          {/* Datos del Vehículo */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-lg font-bold text-gray-800">
                Selecciona tu Vehículo
              </label>
            </div>
            
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
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
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
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-400 cursor-pointer transition duration-200 bg-white">
                <input type="radio" name="craneType" value="medium" defaultChecked className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-gray-300"/>
                <div className="ml-4">
                  <span className="block text-md font-bold text-gray-900">Vehículo Mediano</span>
                  <span className="block text-sm text-gray-500 mt-0.5 font-medium">Autos, SUVs</span>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-400 cursor-pointer transition duration-200 bg-white">
                <input type="radio" name="craneType" value="large" className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-gray-300"/>
                <div className="ml-4">
                  <span className="block text-md font-bold text-gray-900">Vehículo Grande</span>
                  <span className="block text-sm text-gray-500 mt-0.5 font-medium">Camionetas, Vans</span>
                </div>
              </label>
              <label className="flex items-center p-4 border-2 border-gray-200 rounded-xl hover:border-yellow-400 cursor-pointer transition duration-200 bg-white">
                <input type="radio" name="craneType" value="conventional" className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-gray-300"/>
                <div className="ml-4">
                  <span className="block text-md font-bold text-gray-900">Grúa Convencional</span>
                  <span className="block text-sm text-gray-500 mt-0.5 font-medium">Arrastre estándar</span>
                </div>
              </label>
            </div>
          </div>

          <button type="submit" className="w-full px-6 py-4 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition text-xl duration-200 cursor-pointer">
            Confirmar y Buscar Grúa
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
