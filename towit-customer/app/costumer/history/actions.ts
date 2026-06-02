"use server";

import { db } from "@/db";
import { trip, customer, vehicle } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc, count } from "drizzle-orm";
import { getTowerDriverInfo } from "@/services/towerService";
import { getTripRating } from "@/services/feedbackService";

const PAGE_SIZE = 10;

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

export async function getTripsAction(page: number = 1) {
  try {
    const customerRecord = await getOrCreateCustomer();

    const whereFilter = eq(trip.customerId, customerRecord.customerId);

    const [totalResult] = await db
      .select({ value: count() })
      .from(trip)
      .where(whereFilter);

    const totalItems = Number(totalResult.value);
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

    const rawTrips = await db
      .select({
        tripId: trip.tripId,
        date: trip.date,
        time: trip.time,
        status: trip.status,
        originLat: trip.originLat,
        originLng: trip.originLng,
        originChar: trip.originChar,
        DestinationChar: trip.DestinationChar,
        destinationLat: trip.destinationLat,
        destinationLng: trip.destinationLng,
        vehicleBrand: vehicle.brand,
        vehicleModel: vehicle.model,
        towerId: trip.towerId,
      })
      .from(trip)
      .leftJoin(vehicle, eq(trip.vehicleId, vehicle.vehicleId))
      .where(whereFilter)
      .orderBy(desc(trip.date), desc(trip.time))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);

    const userTrips = await Promise.all(rawTrips.map(async (t) => {
      let towerInfo = null;
      let tripRating = null;

      if (t.towerId) {
        try {
          towerInfo = await getTowerDriverInfo(t.towerId);
        } catch (e) {
          console.error("Error fetching tower info:", e);
        }
      }

      if (t.status === "finalizado") {
        try {
          tripRating = await getTripRating(t.tripId, customerRecord.customerId);
        } catch (e) {
          console.error("Error fetching trip rating:", e);
        }
      }

      return {
        ...t,
        towerInfo,
        tripRating: tripRating?.rating ?? null,
      };
    }));

    return { trips: userTrips, totalItems, totalPages, currentPage: page };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error al obtener el historial de viajes."
    return { error: message };
  }
}

export async function geocodeAction(lat: number, lng: number) {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
      headers: {
        "User-Agent": "TowIt-Client-App (contact@towit.com)"
      },
    });
    const data = await res.json();
    if (data && data.address) {
       const address = data.address;
       const road = address.road || address.pedestrian || address.street || "";
       const number = address.house_number || "";
       const neighbourhood = address.neighbourhood || address.suburb || address.quarter || address.city_district || "";
       const city = address.city || address.town || address.village || "";
       const state = address.state || address.province || "";

       const parts = [];
       if (road) parts.push(`${road}${number ? ` ${number}` : ''}`);
       if (neighbourhood) parts.push(neighbourhood);
       if (city) parts.push(city);
       if (state) parts.push(state);
       
       if (parts.length > 0) return parts.join(", ");
    }
    if (data && data.display_name) {
      const parts = data.display_name.split(', ');
      return parts.slice(0, 3).join(', ');
    }
  } catch (error) {
    console.error("Geocode error:", error);
  }
  return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
}
