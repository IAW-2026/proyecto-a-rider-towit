"use server";

import { db } from "@/db";
import { trip, customer } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createTripSchema, tripIdSchema, feedbackSchema } from "@/lib/validation";

import { generatePayment, refundPayment } from "@/services/paymentService";
import { requestTowerForTrip, cancelTowerRequest } from "@/services/towerService";
import { submitRating } from "@/services/feedbackService";

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
    const parsed = createTripSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues.map(e => e.message).join(". ") };
    }

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
    const currentDate = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, '0') + "-" + String(now.getDate()).padStart(2, '0');
    const currentTime = now.toTimeString().split(" ")[0];

    const v = parsed.data;
    const newTrip = await db.insert(trip).values({
      customerId: customerRecord.customerId,
      vehicleId: v.vehicleId,
      originChar: v.originText || `Lat: ${v.originLat.toFixed(6)}, Lng: ${v.originLng.toFixed(6)}`,
      DestinationChar: v.destinationText || `Lat: ${v.destinationLat.toFixed(6)}, Lng: ${v.destinationLng.toFixed(6)}`,
      originLat: v.originLat.toString(),
      originLng: v.originLng.toString(),
      destinationLat: v.destinationLat.toString(),
      destinationLng: v.destinationLng.toString(),
      status: "pendiente pago",
      date: currentDate,
      time: currentTime,
      towerId: null,
    }).returning();

    const createdTrip = newTrip[0];

    try {
      const paymentResult = await generatePayment({
        trip_id: createdTrip.tripId,
        clerk_id: user.id,
        amount: v.estimatedPrice
      });
      console.log("Pago exitoso simulado:", paymentResult);

      await db.update(trip).set({ status: "en proceso" }).where(eq(trip.tripId, createdTrip.tripId));
      createdTrip.status = "en proceso";
    } catch (e) {
      console.error("Error al cobrar:", e);
    }

    try {
      const towerResult = await requestTowerForTrip({
        customer_id: user.id,
        trip: {
          id: String(createdTrip.tripId),
          origin: { lat: v.originLat.toString(), long: v.originLng.toString() },
          destination: { lat: v.destinationLat.toString(), long: v.destinationLng.toString() },
        },
        vehicle_data: { brand: "", model: "", year: 0 },
      });

      if (towerResult?.tower_id) {
        await db.update(trip)
          .set({ towerId: towerResult.tower_id })
          .where(eq(trip.tripId, createdTrip.tripId));
        createdTrip.towerId = towerResult.tower_id;
      }
    } catch (e) {
      console.error("Error al asignar tower:", e);
    }

    revalidatePath("/costumer/request-ride");
    return { success: true, trip: createdTrip };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hubo un error al crear la solicitud de grúa."
    console.error("Error creating trip:", error);
    return { error: message };
  }
}

export async function cancelTripAction(tripId: number) {
  try {
    const parsed = tripIdSchema.safeParse(tripId);
    if (!parsed.success) {
      return { error: "ID de viaje inválido" };
    }

    const user = await currentUser();
    if (!user) {
      return { error: "Acceso denegado." };
    }

    console.log(`Iniciando cancelación del viaje #${tripId}`);

    const refundResult = await refundPayment({
      trip_id: String(tripId),
      clerk_id: user.id,
      reason: "Cancelación por el usuario desde la UI",
      refund_type: "full"
    });
    console.log("Reembolso simulado exitoso:", refundResult);

    const cancelResult = await cancelTowerRequest(String(tripId));
    console.log("Cancelación desde la app de la grúa exitosa:", cancelResult);

    await db.update(trip).set({ status: "cancelado" }).where(eq(trip.tripId, tripId));

    revalidatePath("/costumer/history");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hubo un error al cancelar el viaje."
    console.error("Error cancelando el viaje:", error);
    return { error: message };
  }
}

export async function finishTripAction(tripId: number) {
  try {
    const parsed = tripIdSchema.safeParse(tripId);
    if (!parsed.success) {
      return { error: "ID de viaje inválido" };
    }

    const user = await currentUser();
    if (!user) {
      return { error: "Acceso denegado." };
    }

    console.log(`Marcando el viaje #${tripId} como finalizado`);
    await db.update(trip).set({ status: "finalizado" }).where(eq(trip.tripId, tripId));

    revalidatePath("/costumer/history");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hubo un error al finalizar el viaje."
    console.error("Error finalizando el viaje:", error);
    return { error: message };
  }
}

export async function submitFeedbackAction(data: {
  tripId: number;
  rating: number;
  comment?: string;
}) {
  try {
    const parsed = feedbackSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues.map(e => e.message).join(". ") };
    }

    const user = await currentUser();
    if (!user) {
      return { error: "Acceso denegado." };
    }

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.clerkId, user.id)
    });

    if (!customerRecord) {
      return { error: "Cliente no encontrado." };
    }

    const v = parsed.data;
    const feedbackResult = await submitRating({
      trip_id: v.tripId,
      customer_id: customerRecord.customerId,
      rating: v.rating,
      comment: v.comment
    });

    if (!feedbackResult) {
      return { error: "No se recibió respuesta de Feedback App." };
    }

    console.log("Feedback enviado exitosamente:", feedbackResult);

    revalidatePath("/costumer/history");
    return { success: true, rating: feedbackResult.rating };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hubo un error al enviar la calificación."
    console.error("Error enviando feedback:", error);
    return { error: message };
  }
}
