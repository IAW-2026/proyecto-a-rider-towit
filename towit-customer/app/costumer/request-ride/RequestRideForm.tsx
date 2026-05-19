"use client";

import { useState } from "react";
import DynamicMap from "@/app/costumer/request-ride/map-components/DynamicMap";
import AddressSearch from "@/app/costumer/request-ride/map-components/AddressSearch";

export default function RequestRideForm() {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) {
      alert("Por favor selecciona correctamente el origen y el destino desde las sugerencias.");
      return;
    }
    alert("¡Buscando grúa! (Funcionalidad simulada)");
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
            <label htmlFor="vehicle" className="block text-lg font-bold text-gray-800 mb-2">Datos del Vehículo</label>
            <input type="text" id="vehicle" name="vehicle" placeholder="Ej: Toyota Corolla 2020, color rojo" className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-yellow-400 focus:border-yellow-400 transition" />
          </div>

          {/* Tipo de Grúa */}
          <div>
            <label className="block text-lg font-bold text-gray-800 mb-2">Tipo de Grúa</label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg hover:border-yellow-400 cursor-pointer transition">
                <input type="radio" name="craneType" value="medium" defaultChecked className="h-5 w-5 text-yellow-500 focus:ring-yellow-400"/>
                <span className="ml-4 text-md font-medium text-gray-700">Vehículo Mediano (Autos, SUVs)</span>
              </label>
              <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg hover:border-yellow-400 cursor-pointer transition">
                <input type="radio" name="craneType" value="large" className="h-5 w-5 text-yellow-500 focus:ring-yellow-400"/>
                <span className="ml-4 text-md font-medium text-gray-700">Vehículo Grande (Camionetas, Vans)</span>
              </label>
              <label className="flex items-center p-4 border-2 border-gray-300 rounded-lg hover:border-yellow-400 cursor-pointer transition">
                <input type="radio" name="craneType" value="conventional" className="h-5 w-5 text-yellow-500 focus:ring-yellow-400"/>
                <span className="ml-4 text-md font-medium text-gray-700">Grúa Convencional (Arrastre)</span>
              </label>
            </div>
          </div>

          <button type="submit" className="w-full px-6 py-4 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition text-xl duration-200 cursor-pointer">
            Confirmar y Buscar Grúa
          </button>
        </form>
      </div>

      {/* Columna del Mapa */}
      <div className="lg:flex items-center justify-center bg-gray-200 rounded-xl shadow-inner overflow-hidden h-96 lg:h-auto">
        <DynamicMap origin={origin} destination={destination} />
      </div>
    </div>
  );
}
