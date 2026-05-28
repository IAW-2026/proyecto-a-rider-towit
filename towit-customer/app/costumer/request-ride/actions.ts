"use server";

import { db } from "@/db";
import { trip, customer } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Importamos los mocks de los servicios
import { generatePayment, refundPayment } from "@/services/paymentService";
import { cancelTowerRequest } from "@/services/towerService";

export async function createTripAction(data: {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  originText?: string;
  destinationText?: string;
  vehicleId: number;
  craneType: string;
  estimatedPrice: number;
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
      status: "pendiente pago",
      date: currentDate,
      time: currentTime,
      towerId: null,      // explicitamente nulo como pide
      feedbackId: null,   // explicitamente nulo como pide
    }).returning();

    const createdTrip = newTrip[0];

    // ==========================================
    // ETAPA MOCK: Lógica de cobro simulada (Payments App)
    // ==========================================
    try {
      const paymentResult = await generatePayment({
        trip_id: createdTrip.tripId,
        clerk_id: user.id,
        amount: data.estimatedPrice
      });
      console.log("Pago exitoso simulado:", paymentResult);
      
      // Actualizamos el viaje a 'en proceso' ya que el pago se completó
      await db.update(trip).set({ status: "en proceso" }).where(eq(trip.tripId, createdTrip.tripId));
      createdTrip.status = "en proceso";

    } catch (e) {
      console.error("Error al cobrar:", e);
      // Como esto es un mock, no detenemos el viaje ante error, pero en la vida real sí se haría.
    }
    // ==========================================

    revalidatePath("/costumer/request-ride");

    return { success: true, trip: createdTrip };
  } catch (error: any) {
    console.error("Error creating trip:", error);
    return { error: "Hubo un error al crear la solicitud de grúa." };
  }
}

export async function cancelTripAction(tripId: number) {
  try {
    const user = await currentUser();
    if (!user) {
      return { error: "Acceso denegado." };
    }

    // ==========================================
    // ETAPA MOCK: Lógica de reembolso y cancelación (Payments App y Tower App)
    // ==========================================
    console.log(`Iniciando cancelación del viaje #${tripId}`);
    
    // 1. Avisamos a Payments App que nos devuelva la plata
    const refundResult = await refundPayment({
      trip_id: String(tripId),
      clerk_id: user.id,
      reason: "Cancelación por el usuario desde la UI",
      refund_type: "full"
    });
    console.log("Reembolso simulado exitoso:", refundResult);

    // 2. Avisamos a Tower App que no mande la grúa
    const cancelResult = await cancelTowerRequest(String(tripId));
    console.log("Cancelación desde la app de la grúa exitosa:", cancelResult);
    
    // 3. Actualizamos en nuestra propia base de datos (Customer App)
    await db.update(trip).set({ status: "cancelado" }).where(eq(trip.tripId, tripId));

    revalidatePath("/costumer/history");
    return { success: true };
  } catch (error: any) {
    console.error("Error cancelando el viaje:", error);
    return { error: "Hubo un error al cancelar el viaje." };
  }
}

export async function finishTripAction(tripId: number) {
  try {
    const user = await currentUser();
    if (!user) {
      return { error: "Acceso denegado." };
    }

    console.log(`Marcando el viaje #${tripId} como finalizado`);
    
    // Actualizamos en nuestra propia base de datos
    await db.update(trip).set({ status: "finalizado" }).where(eq(trip.tripId, tripId));

    revalidatePath("/costumer/history");
    return { success: true };
  } catch (error: any) {
    console.error("Error finalizando el viaje:", error);
    return { error: "Hubo un error al finalizar el viaje." };
  }
}
