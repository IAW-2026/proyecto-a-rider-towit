"use server";

import { db } from "@/db";
import { trip, customer, vehicle } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createTripSchema, tripIdSchema, feedbackSchema } from "@/lib/validation";

import { USE_MOCK_PAYMENT, USE_MOCK_TOWER } from "@/lib/service-utils";
import { TRIP_STATUS, TERMINAL_STATUSES } from "@/lib/trip-status";
import { generatePayment, refundPayment } from "@/services/paymentService";
import { requestTowerForTrip, cancelTowerRequest, getTowerDriverInfo } from "@/services/towerService";
import type { TowerRequestPayload } from "@/services/towerService";
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
      status: TRIP_STATUS.PENDING_PAYMENT,
      date: currentDate,
      time: currentTime,
      towerId: null,
      estimatedPrice: v.estimatedPrice.toString(),
      preferredTowType: v.craneType,
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

    return { success: true, trip: createdTrip, useMocks: USE_MOCK_PAYMENT(), useMockTower: USE_MOCK_TOWER() };
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

    let vehicleData = { brand: "", model: "", year: 0 };

    if (tripRecord.vehicleId) {
      const vehicleRecord = await db.query.vehicle.findFirst({
        where: eq(vehicle.vehicleId, tripRecord.vehicleId),
      });
      if (vehicleRecord) {
        vehicleData = {
          brand: vehicleRecord.brand,
          model: vehicleRecord.model,
          year: vehicleRecord.year,
        };
      }
    }

    // Always set DB to PAYMENT_CONFIRMED — payment is already confirmed at this point
    // TowerApp request is best-effort; if it fails, the trip stays in PAYMENT_CONFIRMED
    // and will be retried via polling / picked up when TowerApp assigns a tower.
    await db.update(trip).set({ status: TRIP_STATUS.PAYMENT_CONFIRMED }).where(eq(trip.tripId, tripId));

    try {
      const towerPayload: TowerRequestPayload = {
        trip_id: String(tripId),
        customer_id: user.id,
        trip: {
          id: String(tripId),
          origin: { lat: tripRecord.originLat, long: tripRecord.originLng, address: tripRecord.originChar ?? undefined },
          destination: { lat: tripRecord.destinationLat, long: tripRecord.destinationLng, address: tripRecord.DestinationChar ?? undefined },
        },
        vehicle_data: vehicleData,
        preferred_tow_type: tripRecord.preferredTowType || undefined,
        service_value: tripRecord.estimatedPrice ? parseFloat(tripRecord.estimatedPrice) : undefined,
      };
      console.log("requestTowerForTrip payload:", JSON.stringify(towerPayload));
      const towerResult = await requestTowerForTrip(towerPayload);

      const towerId = towerResult?.tower_id;
      if (typeof towerId === "string") {
        await db.update(trip).set({ status: TRIP_STATUS.IN_PROGRESS, towerId }).where(eq(trip.tripId, tripId));
      }
    } catch (error: unknown) {
      console.error("Tower request failed (trip stays PAYMENT_CONFIRMED):", error);
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

    try {
      const refundResult = await refundPayment({
        tripId: String(tripId),
        clerkId: user.id,
        refundType: "TOTAL",
      });
      console.log("Reembolso exitoso:", refundResult);
    } catch (e) {
      console.error("Error al reembolsar:", e);
    }

    try {
      const cancelResult = await cancelTowerRequest(String(tripId));
      console.log("Cancelación desde la app de la grúa exitosa:", cancelResult);
    } catch (e) {
      console.error("Error cancelando en TowerApp:", e);
    }

    await db.update(trip).set({ status: TRIP_STATUS.CANCELLED }).where(eq(trip.tripId, tripId));

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

    await db.update(trip).set({ status: TRIP_STATUS.COMPLETED }).where(eq(trip.tripId, tripId));

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
    return { confirmed: tripRecord?.status === TRIP_STATUS.PAYMENT_CONFIRMED };
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

    if (TERMINAL_STATUSES.includes(latestTrip.status as typeof TERMINAL_STATUSES[number])) return { trip: null };

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

export async function syncTripStatusAction(tripId: number, status: string, towerId: string | null) {
  try {
    const user = await currentUser();
    if (!user) return { error: "Acceso denegado." };

    const customerRecord = await db.query.customer.findFirst({
      where: eq(customer.clerkId, user.id),
    });
    if (!customerRecord) return { error: "Cliente no encontrado." };

    await db
      .update(trip)
      .set({ status, ...(towerId ? { towerId } : {}) })
      .where(and(eq(trip.tripId, tripId), eq(trip.customerId, customerRecord.customerId)));

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al sincronizar estado del viaje."
    console.error("Error syncing trip status:", error);
    return { error: message };
  }
}

export async function getDriverInfoAction(tripId: number) {
  try {
    const user = await currentUser();
    if (!user) return { error: "Acceso denegado." };

    const tripRecord = await db.query.trip.findFirst({
      where: eq(trip.tripId, tripId),
    });

    const towerId = tripRecord?.towerId;
    if (!towerId) return { error: "No se encontró un towerId para este viaje." };

    const [info, avgRating] = await Promise.all([
      getTowerDriverInfo(towerId).catch(() => null),
      getAvgRating(towerId).catch(() => ({ avg_rating: 5 })),
    ]);

    console.log(`[getAvgRating] towerId=${towerId} response=`, avgRating);

    const driverRating = avgRating?.avg_rating ?? info?.driver_rating ?? 0;

    return { success: true, driverName: info?.driver_name ?? "", driverRating, driverPhone: info?.driver_phone ?? "", vehicleBrand: info?.vehicle_brand ?? "", vehicleModel: info?.vehicle_model ?? "", vehicleYear: info?.vehicle_year ?? 0 };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener info del conductor."
    console.error("Error fetching driver info:", error);
    return { error: message };
  }
}
