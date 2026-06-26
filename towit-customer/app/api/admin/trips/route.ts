import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { db } from "@/db";
import { trip, customer } from "@/db/schema";
import { eq, ilike, and, or, desc, asc, sql, type SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authError = authenticate(request)
  if (authError) return authError.error

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;
  const deleted = searchParams.get("deleted") || "ACTIVE";
  const sort = searchParams.get("sort") || "newest";

  const conditions: SQL<unknown>[] = [];
  if (search) {
    const searchCondition = or(
      ilike(trip.originChar, `%${search}%`),
      ilike(trip.DestinationChar, `%${search}%`),
      ilike(customer.fullName, `%${search}%`),
      sql`${trip.tripId}::text ILIKE ${`%${search}%`}`,
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  if (status && status !== "ALL") {
    conditions.push(eq(trip.status, status));
  }
  if (deleted === "ACTIVE") {
    conditions.push(eq(trip.isDeleted, false));
  } else if (deleted === "DELETED") {
    conditions.push(eq(trip.isDeleted, true));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy = sort === "oldest"
    ? [asc(trip.date), asc(trip.time)]
    : [desc(trip.date), desc(trip.time)];

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(trip)
    .leftJoin(customer, eq(trip.customerId, customer.customerId))
    .where(where);

  const data = await db
    .select({
      tripId: trip.tripId,
      customerId: trip.customerId,
      customerName: customer.fullName,
      vehicleId: trip.vehicleId,
      towerId: trip.towerId,
      originChar: trip.originChar,
      destinationChar: trip.DestinationChar,
      estimatedPrice: trip.estimatedPrice,
      date: trip.date,
      time: trip.time,
      status: trip.status,
      isDeleted: trip.isDeleted,
    })
    .from(trip)
    .leftJoin(customer, eq(trip.customerId, customer.customerId))
    .where(where)
    .offset((page - 1) * limit)
    .limit(limit)
    .orderBy(...orderBy);

  return NextResponse.json({
    data,
    total: Number(totalResult.count),
    page,
    limit,
  });
}
