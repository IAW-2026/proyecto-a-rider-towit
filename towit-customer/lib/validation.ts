import { z } from "zod"

const capitalize = (v: string) => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase()

export const vehicleSchema = z.object({
  brand: z.string().min(1, "La marca es requerida").max(100, "La marca no puede superar 100 caracteres").transform(capitalize),
  model: z.string().min(1, "El modelo es requerido").max(100, "El modelo no puede superar 100 caracteres").transform(capitalize),
  year: z.coerce.number().int("El año debe ser un número entero").min(1900, "Año inválido").max(2100, "Año inválido"),
  weight: z.coerce.number().min(0, "El peso no puede ser negativo").max(999999, "Peso inválido"),
})

export const editVehicleSchema = vehicleSchema.extend({
  vehicleId: z.coerce.number().int("ID de vehículo inválido").positive(),
})

export const createTripSchema = z.object({
  originLat: z.number().min(-90).max(90, "Latitud de origen inválida"),
  originLng: z.number().min(-180).max(180, "Longitud de origen inválida"),
  destinationLat: z.number().min(-90).max(90, "Latitud de destino inválida"),
  destinationLng: z.number().min(-180).max(180, "Longitud de destino inválida"),
  originText: z.string().optional(),
  destinationText: z.string().optional(),
  vehicleId: z.coerce.number().int().positive("Seleccioná un vehículo válido"),
  craneType: z.string().min(1, "Seleccioná un tipo de grúa"),
  estimatedPrice: z.coerce.number().min(0, "El precio debe ser positivo"),
})

export const tripIdSchema = z.coerce.number().int().positive("ID de viaje inválido")

export const feedbackSchema = z.object({
  tripId: z.coerce.number().int().positive(),
  rating: z.coerce.number().int().min(1, "La calificación debe ser entre 1 y 5").max(5, "La calificación debe ser entre 1 y 5"),
  comment: z.string().max(500, "El comentario no puede superar 500 caracteres").optional(),
})

export function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((e) => e.message)
}
