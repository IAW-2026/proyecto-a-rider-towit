import { NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { db } from "@/db";
import { trip, customer, vehicle } from "@/db/schema";
import { count, desc, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const authError = authenticate(request as any)
  if (authError) return authError.error

  const [tripCount] = await db.select({ count: count() }).from(trip);
  const [customerCount] = await db.select({ count: count() }).from(customer);
  const [vehicleCount] = await db.select({ count: count() }).from(vehicle);

  const recentTrips = await db
    .select({
      tripId: trip.tripId,
      date: trip.date,
      time: trip.time,
      customerName: customer.fullName,
      originChar: trip.originChar,
      destinationChar: trip.DestinationChar,
      status: trip.status,
    })
    .from(trip)
    .leftJoin(customer, eq(trip.customerId, customer.customerId))
    .orderBy(desc(trip.date), desc(trip.time))
    .limit(15);

  return NextResponse.json({
    tripCount: tripCount.count,
    customerCount: customerCount.count,
    vehicleCount: vehicleCount.count,
    recentTrips: recentTrips.map((t) => ({
      ...t,
      status: t.status?.toUpperCase().replace(/\s+/g, "_") ?? "UNKNOWN",
    })),
  });
}
