"use server";

import { db } from "@/db";
import { vehicle, customer } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Función auxiliar para obtener o crear el cliente en nuestra Base de Datos
async function getOrCreateCustomer() {
  const user = await currentUser();
  if (!user) throw new Error("Acceso denegado. No estás autenticado.");

  // Buscar cliente por clerkId
  let customerRecord = await db.query.customer.findFirst({
    where: eq(customer.clerkId, user.id)
  });

  // Si no está registrado en la base de datos de Neon, lo creamos
  if (!customerRecord) {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuario sin nombre';
    const insertedCustomer = await db.insert(customer).values({
      clerkId: user.id,
      fullName: fullName,
    }).returning();
    
    customerRecord = insertedCustomer[0];
  }

  return customerRecord;
}

export async function addVehicleAction(formData: FormData) {
  try {
    const brand = formData.get("brand")?.toString();
    const model = formData.get("model")?.toString();
    const year = Number(formData.get("year"));
    const weight = Number(formData.get("weight"));

    if (!brand || !model || !year) {
      return { error: "Campos requeridos faltantes" };
    }

    const currentCustomer = await getOrCreateCustomer();

    // Insertar el vehículo referenciando al customerId
    await db.insert(vehicle).values({
      customerId: currentCustomer.customerId,
      brand,
      model,
      year,
      weight: weight ? weight.toString() : null, // el esquema espera un string/decimal o number
    });

    revalidatePath("/costumer/vehicles");
    return { success: true };
  } catch (error) {
    console.error("Error al guardar el vehículo:", error);
    return { error: "Hubo un error al guardar el vehículo. Inténtalo de nuevo." };
  }
}

export async function deleteVehicleAction(vehicleId: number) {
  try {
    const user = await currentUser();
    if (!user) throw new Error("Acceso denegado");

    const currentCustomer = await db.query.customer.findFirst({
      where: eq(customer.clerkId, user.id)
    });

    if (!currentCustomer) {
       return { error: "Cliente no encontrado" };
    }

    // Borrar el vehículo verificando que pertenezca al usuario actual
    await db.delete(vehicle)
      .where(
        and(
          eq(vehicle.vehicleId, vehicleId),
          eq(vehicle.customerId, currentCustomer.customerId)
        )
      );

    revalidatePath("/costumer/vehicles");
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar:", error);
    return { error: "No se pudo eliminar el vehículo." };
  }
}

export async function editVehicleAction(formData: FormData) {
  try {
    const vehicleId = Number(formData.get("vehicleId"));
    const brand = formData.get("brand")?.toString();
    const model = formData.get("model")?.toString();
    const year = Number(formData.get("year"));
    const weight = Number(formData.get("weight"));

    if (!vehicleId || !brand || !model || !year) {
      return { error: "Campos requeridos faltantes" };
    }

    const currentCustomer = await getOrCreateCustomer();

    // Actualizar el vehículo verificando que pertenezca al usuario actual
    await db.update(vehicle)
      .set({
        brand,
        model,
        year,
        weight: weight ? weight.toString() : null,
      })
      .where(
        and(
          eq(vehicle.vehicleId, vehicleId),
          eq(vehicle.customerId, currentCustomer.customerId)
        )
      );

    revalidatePath("/costumer/vehicles");
    return { success: true };
  } catch (error) {
    console.error("Error al editar el vehículo:", error);
    return { error: "Hubo un error al editar el vehículo. Inténtalo de nuevo." };
  }
}
