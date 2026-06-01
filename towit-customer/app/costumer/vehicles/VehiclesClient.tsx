"use client";

import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPencil, faTrash, faCar, faWeightHanging, faCalendar, faTruck } from "@fortawesome/free-solid-svg-icons";
import { addVehicleAction, deleteVehicleAction, editVehicleAction } from "./actions";
import ConfirmModal from "@/components/ui/ConfirmModal";

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
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const submittingRef = useRef(false);

  const handleAddClick = () => { setEditingVehicle(null); setShowForm(true); };
  const handleEditClick = (v: Vehicle) => { setEditingVehicle(v); setShowForm(true); };

  const handleSubmit = async (formData: FormData) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError("");
    let result;
    if (editingVehicle) {
      formData.append("vehicleId", editingVehicle.id);
      result = await editVehicleAction(formData);
    } else {
      result = await addVehicleAction(formData);
    }
    if (result?.error) { setError(result.error); setLoading(false); submittingRef.current = false; return; }
    setEditingVehicle(null);
    setShowForm(false);
    setLoading(false);
    submittingRef.current = false;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteVehicleAction(Number(deleteTarget.id));
    setDeleting(false);
    setDeleteTarget(null);
    if (result?.error) alert(result.error);
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'Geist', sans-serif" }}>
      <div className="mx-auto max-w-2xl px-4 py-0 sm:px-6 sm:py-0q">

        {/* Header */}
        <header className="mb-6 sm:mb-10">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-brand-yellow-dark">
            Mis vehículos
          </p>
          <h1 className="text-[28px] font-extrabold tracking-[-1px] leading-tight text-foreground sm:text-[38px] sm:tracking-[-1.5px]">
            Tus vehículos
          </h1>
          <p className="mt-1.5 text-[14px] text-muted-foreground sm:text-[16px]">
            Agregá y gestioná los vehículos para agilizar tus pedidos.
          </p>
        </header>

        {/* Add button — only when form is hidden */}
        {!showForm && (
          <button
            onClick={handleAddClick}
            className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-yellow/50 bg-brand-yellow/5 py-3.5 text-[14px] font-bold text-brand-yellow transition-all hover:bg-brand-yellow/10 active:bg-brand-yellow/20 cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            Agregar vehículo
          </button>
        )}

        {/* Form */}
        {showForm && (
          <div className="mb-5 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-brand-yellow">
            {/* Form header */}
            <div className="border-b border-border px-4 py-3.5">
              <h3 className="text-[15px] font-bold text-foreground">
                {editingVehicle ? "Editar vehículo" : "Nuevo vehículo"}
              </h3>
            </div>

            {error && (
              <div className="mx-4 mt-4 rounded-xl border border-border bg-muted px-4 py-3 text-[12px] font-medium text-muted-foreground">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="px-4 pb-4 pt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { label: "Marca", name: "brand", id: "vehicle-brand", placeholder: "Toyota", type: "text", val: editingVehicle?.brand, req: true },
                  { label: "Modelo", name: "model", id: "vehicle-model", placeholder: "Corolla", type: "text", val: editingVehicle?.model, req: true },
                  { label: "Año", name: "year", id: "vehicle-year", placeholder: "2020", type: "number", val: editingVehicle?.year, req: true },
                  { label: "Peso (ton)", name: "weight", id: "vehicle-weight", placeholder: "1.5", type: "number", val: editingVehicle?.weight, req: true },
                ].map(({ label, name, id, placeholder, type, val, req }) => (
                  <div key={name}>
                    <label htmlFor={id} className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                      {label} {req && <span className="text-brand-yellow-dark">*</span>}
                    </label>
                    <input
                      id={id}
                      type={type}
                      name={name}
                      defaultValue={val as string | number | undefined}
                      required={req}
                      placeholder={placeholder}
                      step={name === "weight" ? "0.1" : undefined}
                      min={name === "year" ? "1900" : name === "weight" ? "0" : undefined}
                      max={name === "year" ? new Date().getFullYear() + 1 : undefined}
                      className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-[13px] text-foreground outline-none placeholder:text-muted-foreground focus:border-brand-yellow focus:bg-card focus:ring-2 focus:ring-brand-yellow/20 transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingVehicle(null); }}
                  className="flex-1 rounded-xl border border-border bg-card py-3 text-[13px] font-semibold text-muted-foreground transition hover:bg-muted active:bg-muted cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-brand-yellow py-3 text-[13px] font-bold text-black shadow-[0_2px_12px_rgba(245,197,24,0.3)] transition-all hover:brightness-110 disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  {loading ? "Guardando..." : editingVehicle ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Empty state */}
        {!showForm && initialVehicles.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16 text-center">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-yellow/10">
              <FontAwesomeIcon icon={faTruck} className="h-6 w-6 text-brand-yellow-dark" />
            </div>
            <p className="mb-1 text-[15px] font-bold text-foreground">Ningún vehículo registrado</p>
            <p className="text-[13px] text-muted-foreground max-w-[200px]">
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
                className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border"
              >
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <FontAwesomeIcon icon={faCar} className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-bold text-foreground">
                      {vehicle.brand} {vehicle.model}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2.5">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <FontAwesomeIcon icon={faCalendar} className="h-2.5 w-2.5" />
                        {vehicle.year}
                      </span>
                      <span className="h-2.5 w-px bg-border" />
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <FontAwesomeIcon icon={faWeightHanging} className="h-2.5 w-2.5" />
                        {vehicle.weight} ton
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action row */}
                <div className="flex border-t border-border">
                  <button
                    onClick={() => handleEditClick(vehicle)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-muted-foreground transition hover:bg-muted active:bg-muted cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faPencil} className="h-3 w-3" />
                    Editar
                  </button>
                  <div className="w-px bg-border" />
                  <button
                    onClick={() => setDeleteTarget(vehicle)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[12px] font-semibold text-red-400 transition hover:bg-red-900/20 active:bg-red-50 cursor-pointer"
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

      <ConfirmModal
        open={deleteTarget !== null}
        title="Eliminar vehículo"
        message={
          deleteTarget
            ? `¿Estás seguro de que deseas eliminar ${deleteTarget.brand} ${deleteTarget.model}?`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
