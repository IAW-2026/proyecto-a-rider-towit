"use server";

import { db } from "@/db";
import { trip, customer } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createTripSchema, tripIdSchema, feedbackSchema } from "@/lib/validation";

import { USE_MOCK_PAYMENT } from "@/lib/service-utils";
import { generatePayment, refundPayment } from "@/services/paymentService";
import { requestTowerForTrip, cancelTowerRequest } from "@/services/towerService";
import { submitRating, getAvgRating } from "@/services/feedbackService";

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
      estimatedPrice: v.estimatedPrice.toString(),
    }).returning();

    const createdTrip = newTrip[0];

    try {
      await generatePayment({
        tripId: (createdTrip.tripId).toString(),
        clerkId: user.id,
        amount: data.estimatedPrice,
      });
    } catch (e) {
      console.error("Error al registrar pago en Payments App:", e);
    }

    revalidatePath("/customer/request-ride");

    return { success: true, trip: createdTrip, useMocks: USE_MOCK_PAYMENT() };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hubo un error al crear la solicitud de grúa."
    console.error("Error creating trip:", error);
    return { error: message };
  }
}

export async function confirmPaymentAction(tripId: number) {
  try {
    const parsed = tripIdSchema.safeParse(tripId);
    if (!parsed.success) {
      return { error: "ID de viaje inválido" };
    }

    const user = await currentUser();
    if (!user) {
      return { error: "Acceso denegado." };
    }

    const tripRecord = await db.query.trip.findFirst({
      where: eq(trip.tripId, tripId),
    });

    if (!tripRecord) {
      return { error: "Viaje no encontrado." };
    }

    const towerResult = await requestTowerForTrip({
      customer_id: user.id,
      trip: {
        id: String(tripId),
        origin: { lat: tripRecord.originLat, long: tripRecord.originLng },
        destination: { lat: tripRecord.destinationLat, long: tripRecord.destinationLng },
      },
      vehicle_data: { brand: "", model: "", year: 0 },
    });

    if (towerResult?.tower_id) {
      await db.update(trip)
        .set({ towerId: towerResult.tower_id, status: "en proceso" })
        .where(eq(trip.tripId, tripId));
    } else {
      await db.update(trip)
        .set({ status: "en proceso" })
        .where(eq(trip.tripId, tripId));
    }

    revalidatePath("/customer/request-ride");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al confirmar el pago."
    console.error("Error confirming payment:", error);
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
      tripId: String(tripId),
      clerkId: user.id,
      refundType: "TOTAL",
    });
    console.log("Reembolso exitoso:", refundResult);

    const cancelResult = await cancelTowerRequest(String(tripId));
    console.log("Cancelación desde la app de la grúa exitosa:", cancelResult);

    await db.update(trip).set({ status: "cancelado" }).where(eq(trip.tripId, tripId));

    revalidatePath("/customer/history");
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

    await db.update(trip).set({ status: "finalizado" }).where(eq(trip.tripId, tripId));

    revalidatePath("/customer/history");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hubo un error al finalizar el viaje."
    console.error("Error finalizando el viaje:", error);
    return { error: message };
  }
}

export async function getTripByIdAction(tripId: number) {
  try {
    const parsed = tripIdSchema.safeParse(tripId);
    if (!parsed.success) {
      return { trip: null };
    }

    const user = await currentUser();
    if (!user) return { trip: null };

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.clerkId, user.id),
    });

    if (!customerRecord) return { trip: null };

    const tripRecord = await db.query.trip.findFirst({
      where: and(
        eq(trip.tripId, tripId),
        eq(trip.customerId, customerRecord.customerId),
      ),
    });

    if (!tripRecord) return { trip: null };

    return {
      trip: {
        tripId: tripRecord.tripId,
        status: tripRecord.status,
        originLat: parseFloat(tripRecord.originLat),
        originLng: parseFloat(tripRecord.originLng),
        destinationLat: parseFloat(tripRecord.destinationLat),
        destinationLng: parseFloat(tripRecord.destinationLng),
        estimatedPrice: tripRecord.estimatedPrice ? parseFloat(tripRecord.estimatedPrice) : null,
        towerId: tripRecord.towerId,
      },
    };
  } catch {
    return { trip: null };
  }
}

export async function getTripPaymentStatusAction(tripId: number) {
  try {
    const tripRecord = await db.query.trip.findFirst({
      where: eq(trip.tripId, tripId),
      columns: { status: true },
    });
    return { confirmed: tripRecord?.status === "pago confirmado" };
  } catch {
    return { confirmed: false };
  }
}

export async function getLatestActiveTripAction() {
  try {
    const user = await currentUser();
    if (!user) return { trip: null };

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.clerkId, user.id),
    });

    if (!customerRecord) return { trip: null };

    const latestTrip = await db.query.trip.findFirst({
      where: eq(trip.customerId, customerRecord.customerId),
      orderBy: [desc(trip.date), desc(trip.time)],
    });

    if (!latestTrip) return { trip: null };

    const terminalStatuses = ["finalizado", "cancelado"];
    if (terminalStatuses.includes(latestTrip.status)) return { trip: null };

    return {
      trip: {
        tripId: latestTrip.tripId,
        status: latestTrip.status,
        originLat: parseFloat(latestTrip.originLat),
        originLng: parseFloat(latestTrip.originLng),
        destinationLat: parseFloat(latestTrip.destinationLat),
        destinationLng: parseFloat(latestTrip.destinationLng),
        estimatedPrice: latestTrip.estimatedPrice ? parseFloat(latestTrip.estimatedPrice) : null,
        towerId: latestTrip.towerId,
      },
    };
  } catch {
    return { trip: null };
  }
}

export async function getAvgRatingAction() {
  try {
    const user = await currentUser();
    if (!user) return { avg_rating: null };
    return await getAvgRating(user.id);
  } catch {
    return { avg_rating: 5 };
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
      customer_id: user.id,
      rating: v.rating,
      comment: v.comment
    });

    if (!feedbackResult) {
      return { error: "No se recibió respuesta de Feedback App." };
    }

    console.log("Feedback enviado exitosamente:", feedbackResult);

    revalidatePath("/customer/history");
    return { success: true, rating: feedbackResult.rating };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Hubo un error al enviar la calificación."
    console.error("Error enviando feedback:", error);
    return { error: message };
  }
}
