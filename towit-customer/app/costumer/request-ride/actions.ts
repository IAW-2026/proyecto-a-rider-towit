"use server";

import { db } from "@/db";
import { trip, customer } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createTripAction(data: {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  originText?: string;
  destinationText?: string;
  vehicleId: number;
  craneType: string;
}) {
  try {
    const user = await currentUser();
    if (!user) {
      return { error: "Acceso denegado. No estás autenticado." };
    }

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.clerkId, user.id)
    });

    if (!customerRecord) {
      return { error: "Error: Cuenta de cliente no encontrada." };
    }

    const now = new Date();
    // YYYY-MM-DD (Usando la fecha local)
    const currentDate = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
    // HH:MM:SS (Usando la hora local)
    const currentTime = now.toTimeString().split(" ")[0];

    const newTrip = await db.insert(trip).values({
      customerId: customerRecord.customerId,
      vehicleId: data.vehicleId,
      originChar: data.originText || `Lat: ${data.originLat.toFixed(6)}, Lng: ${data.originLng.toFixed(6)}`,
      DestinationChar: data.destinationText || `Lat: ${data.destinationLat.toFixed(6)}, Lng: ${data.destinationLng.toFixed(6)}`,
      originLat: data.originLat.toString(),
      originLng: data.originLng.toString(),
      destinationLat: data.destinationLat.toString(),
      destinationLng: data.destinationLng.toString(),
      status: "pendiente",
      date: currentDate,
      time: currentTime,
      towerId: null,      // explicitamente nulo como pide
      feedbackId: null,   // explicitamente nulo como pide
    }).returning();

    revalidatePath("/costumer/request-ride");

    return { success: true, trip: newTrip[0] };
  } catch (error: any) {
    console.error("Error creating trip:", error);
    return { error: "Hubo un error al crear la solicitud de grúa." };
  }
}
