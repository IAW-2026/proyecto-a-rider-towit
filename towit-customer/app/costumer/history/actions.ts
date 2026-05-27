"use server";

import { db } from "@/db";
import { trip, customer, vehicle } from "@/db/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";

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

export async function getTripsAction() {
  try {
    const customerRecord = await getOrCreateCustomer();
    
    // Obtener los viajes del usuario actual, ordenados por fecha/hora descendente
    // También podés hacer un join con vehicle si necesitas mostrar el vehículo usado
    const userTrips = await db
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
      })
      .from(trip)
      .leftJoin(vehicle, eq(trip.vehicleId, vehicle.vehicleId))
      .where(eq(trip.customerId, customerRecord.customerId))
      .orderBy(desc(trip.date), desc(trip.time));

    return { trips: userTrips };
  } catch (error: any) {
    return { error: error.message || "Error al obtener el historial de viajes." };
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
