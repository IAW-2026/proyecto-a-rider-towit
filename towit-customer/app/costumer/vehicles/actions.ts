"use server";

import { db } from "@/db";
import { vehicle, customer } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { vehicleSchema, editVehicleSchema, tripIdSchema } from "@/lib/validation";

async function getOrCreateCustomer() {
  const user = await currentUser();
  if (!user) throw new Error("Acceso denegado. No estás autenticado.");

  let customerRecord = await db.query.customer.findFirst({
    where: eq(customer.clerkId, user.id)
  });

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
    const parsed = vehicleSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues.map(e => e.message).join(". ") };
    }

    const { brand, model, year, weight } = parsed.data;
    const currentCustomer = await getOrCreateCustomer();

    const newVehicle = await db.insert(vehicle).values({
      customerId: currentCustomer.customerId,
      brand,
      model,
      year,
      weight: weight ? weight.toString() : null,
    }).returning();

    revalidatePath("/costumer/vehicles");
    revalidatePath("/costumer/request-ride");
    return { success: true, vehicle: newVehicle[0] };
  } catch (error) {
    console.error("Error al guardar el vehículo:", error);
    return { error: "Hubo un error al guardar el vehículo. Inténtalo de nuevo." };
  }
}

export async function deleteVehicleAction(vehicleId: number) {
  try {
    const parsed = tripIdSchema.safeParse(vehicleId);
    if (!parsed.success) {
      return { error: "ID de vehículo inválido" };
    }

    const user = await currentUser();
    if (!user) throw new Error("Acceso denegado");

    const currentCustomer = await db.query.customer.findFirst({
      where: eq(customer.clerkId, user.id)
    });

    if (!currentCustomer) {
      return { error: "Cliente no encontrado" };
    }

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
    const parsed = editVehicleSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      return { error: parsed.error.issues.map(e => e.message).join(". ") };
    }

    const { vehicleId, brand, model, year, weight } = parsed.data;
    const currentCustomer = await getOrCreateCustomer();

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
