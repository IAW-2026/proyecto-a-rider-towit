"use client";

import { useState } from "react";
import { addVehicleAction, deleteVehicleAction, editVehicleAction } from "./actions";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  weight: number;
}

export default function VehiclesClient({ initialVehicles = [] }: { initialVehicles?: Vehicle[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddClick = () => {
    setEditingVehicle(null);
    setShowForm(true);
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setShowForm(true);
  };

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError("");
    
    let result;
    if (editingVehicle) {
      formData.append("vehicleId", editingVehicle.id);
      result = await editVehicleAction(formData);
    } else {
      result = await addVehicleAction(formData);
    }

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Server action triggerea revalidatePath, por ende actualiza prop 'initialVehicles'
    setEditingVehicle(null);
    setShowForm(false);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este vehículo?")) {
      const result = await deleteVehicleAction(Number(id));
      if (result?.error) {
        alert(result.error);
      }
    }
  };

  return (
    <>
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
            Mis Vehículos
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            Agrega, edita y elimina tus vehículos para agilizar el pedido de remolque.
          </p>
        </div>
        {!showForm && (
          <button 
            onClick={handleAddClick}
            className="px-6 py-3 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition text-lg duration-200 cursor-pointer shadow-sm"
          >
            + Agregar Vehículo
          </button>
        )}
      </header>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm mb-6">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">
            {editingVehicle ? "Editar Vehículo" : "Agregar Nuevo Vehículo"}
          </h3>
          
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca *</label>
                <input 
                  type="text" 
                  name="brand" 
                  defaultValue={editingVehicle?.brand}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-300 focus:border-yellow-300 outline-none text-black"
                  placeholder="Ej: Toyota"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label>
                <input 
                  type="text" 
                  name="model" 
                  defaultValue={editingVehicle?.model}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-300 focus:border-yellow-300 outline-none text-black"
                  placeholder="Ej: Corolla"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
                <input 
                  type="number" 
                  name="year" 
                  defaultValue={editingVehicle?.year}
                  required
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-300 focus:border-yellow-300 outline-none text-black"
                  placeholder="Ej: 2020"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (Toneladas)</label>
                <input 
                  type="number" 
                  name="weight" 
                  defaultValue={editingVehicle?.weight}
                  step="0.1"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-yellow-300 focus:border-yellow-300 outline-none text-black"
                  placeholder="Ej: 1.5"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => {
                  setShowForm(false);
                  setEditingVehicle(null);
                }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-2 bg-yellow-300 text-black font-bold rounded-lg hover:bg-yellow-400 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? "Guardando..." : (editingVehicle ? "Actualizar Vehículo" : "Guardar Vehículo")}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && initialVehicles.length === 0 ? (
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center text-gray-600 py-16">
          <p className="text-lg mb-4">Aún no tienes vehículos registrados.</p>
          <p>Haz clic en "Agregar Vehículo" para registrar tu primer unidad.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {!showForm && initialVehicles.map((vehicle) => (
            <div key={vehicle.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-gray-600 text-sm">Año: {vehicle.year}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 self-start sm:self-auto">
                  <p className="text-gray-700 font-medium text-sm">Peso: {vehicle.weight} toneladas</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button
                  onClick={() => handleEditClick(vehicle)}
                  className="px-5 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 transition duration-200"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(vehicle.id)}
                  className="px-5 py-2 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200 transition duration-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
