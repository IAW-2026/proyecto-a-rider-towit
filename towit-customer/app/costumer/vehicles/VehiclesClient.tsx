"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPencil, faTrash, faCar, faWeightHanging, faCalendar, faTruck } from "@fortawesome/free-solid-svg-icons";
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

  const handleAddClick = () => { setEditingVehicle(null); setShowForm(true); };
  const handleEditClick = (v: Vehicle) => { setEditingVehicle(v); setShowForm(true); };

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
    if (result?.error) { setError(result.error); setLoading(false); return; }
    setEditingVehicle(null);
    setShowForm(false);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este vehículo?")) {
      const result = await deleteVehicleAction(Number(id));
      if (result?.error) alert(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Geist', sans-serif" }}>
      <div className="mx-auto max-w-2xl px-4 py-0 sm:px-6 sm:py-0">

        {/* Header */}
        <header className="mb-6 sm:mb-10">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#D4A017]">
            Mis vehículos
          </p>
          <h1 className="text-[28px] font-extrabold tracking-[-1px] leading-tight text-gray-900 sm:text-[38px] sm:tracking-[-1.5px]">
            Tus vehículos
          </h1>
          <p className="mt-1.5 text-[14px] text-gray-500 sm:text-[16px]">
            Agregá y gestioná los vehículos para agilizar tus pedidos.
          </p>
        </header>

        {/* Add button — only when form is hidden */}
        {!showForm && (
          <button
            onClick={handleAddClick}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#F5C518]/50 bg-[#F5C518]/5 py-3.5 text-[14px] font-bold text-[#7A600A] transition-all active:bg-[#F5C518]/10"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            Agregar vehículo
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#F5C518]">
            {/* Form header */}
            <div className="border-b border-gray-100 px-4 py-3.5">
              <h3 className="text-[15px] font-bold text-gray-900">
                {editingVehicle ? "Editar vehículo" : "Nuevo vehículo"}
              </h3>
            </div>

            {error && (
              <div className="mx-4 mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-[12px] font-medium text-gray-600">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="px-4 pb-4 pt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Marca", name: "brand", placeholder: "Toyota", type: "text", val: editingVehicle?.brand, req: true },
                  { label: "Modelo", name: "model", placeholder: "Corolla", type: "text", val: editingVehicle?.model, req: true },
                  { label: "Año", name: "year", placeholder: "2020", type: "number", val: editingVehicle?.year, req: true },
                  { label: "Peso (ton)", name: "weight", placeholder: "1.5", type: "number", val: editingVehicle?.weight, req: false },
                ].map(({ label, name, placeholder, type, val, req }) => (
                  <div key={name}>
                    <label className="mb-1 block text-[11px] font-semibold text-gray-500">
                      {label} {req && <span className="text-[#D4A017]">*</span>}
                    </label>
                    <input
                      type={type}
                      name={name}
                      defaultValue={val as string | number | undefined}
                      required={req}
                      placeholder={placeholder}
                      step={name === "weight" ? "0.1" : undefined}
                      min={name === "year" ? "1900" : name === "weight" ? "0" : undefined}
                      max={name === "year" ? new Date().getFullYear() + 1 : undefined}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] text-gray-900 outline-none placeholder:text-gray-300 focus:border-[#F5C518] focus:bg-white focus:ring-2 focus:ring-[#F5C518]/20 transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingVehicle(null); }}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-[13px] font-semibold text-gray-600 transition active:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#F5C518] py-3 text-[13px] font-bold text-black shadow-[0_2px_12px_rgba(245,197,24,0.3)] transition-all disabled:opacity-50 active:scale-95"
                >
                  {loading ? "Guardando..." : editingVehicle ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty state */}
        {!showForm && initialVehicles.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5C518]/10">
              <FontAwesomeIcon icon={faTruck} className="h-6 w-6 text-[#D4A017]" />
            </div>
            <p className="mb-1 text-[15px] font-bold text-gray-900">Ningún vehículo registrado</p>
            <p className="text-[13px] text-gray-400 max-w-[200px]">
              Usá el botón de arriba para agregar tu primer vehículo.
            </p>
          </div>
        )}

        {/* Vehicle list */}
        {!showForm && initialVehicles.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {initialVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
              >
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                    <FontAwesomeIcon icon={faCar} className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2.5">
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <FontAwesomeIcon icon={faCalendar} className="h-2.5 w-2.5" />
                        {vehicle.year}
                      </span>
                      <span className="h-2.5 w-px bg-gray-200" />
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <FontAwesomeIcon icon={faWeightHanging} className="h-2.5 w-2.5" />
                        {vehicle.weight} ton
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action row */}
                <div className="flex border-t border-gray-100">
                  <button
                    onClick={() => handleEditClick(vehicle)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-gray-600 transition active:bg-gray-50"
                  >
                    <FontAwesomeIcon icon={faPencil} className="h-3 w-3" />
                    Editar
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    onClick={() => handleDelete(vehicle.id)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-red-400 transition active:bg-red-50"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                    Eliminar
  		  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
