import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { db } from "@/db";
import { vehicle, customer } from "@/db/schema";
import { eq, ilike, and, or, sql, type SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authError = authenticate(request)
  if (authError) return authError.error

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const search = searchParams.get("search") || undefined;

  const conditions: SQL<unknown>[] = [];
  if (search) {
    const searchCondition = or(
      sql`${vehicle.vehicleId}::text ILIKE ${`%${search}%`}`,
      ilike(vehicle.brand, `%${search}%`),
      ilike(vehicle.model, `%${search}%`),
      ilike(customer.fullName, `%${search}%`),
      sql`${vehicle.year}::text ILIKE ${`%${search}%`}`,
    );
    if (searchCondition) conditions.push(searchCondition);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(vehicle)
    .leftJoin(customer, eq(vehicle.customerId, customer.customerId))
    .where(where);

  const data = await db
    .select({
      vehicleId: vehicle.vehicleId,
      customerId: vehicle.customerId,
      customerName: customer.fullName,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      weight: vehicle.weight,
    })
    .from(vehicle)
    .leftJoin(customer, eq(vehicle.customerId, customer.customerId))
    .where(where)
    .offset((page - 1) * limit)
    .limit(limit)
    .orderBy(vehicle.brand, vehicle.model);

  return NextResponse.json({
    data,
    total: Number(totalResult.count),
    page,
    limit,
  });
}
