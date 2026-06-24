import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { db } from "@/db";
import { customer } from "@/db/schema";
import { eq, ilike, and, sql, type SQL } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const authError = authenticate(request)
  if (authError) return authError.error

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;

  const conditions: SQL<unknown>[] = [];
  if (search) {
    conditions.push(ilike(customer.fullName, `%${search}%`));
  }
  if (status === "ACTIVE") {
    conditions.push(eq(customer.isActive, true));
  } else if (status === "INACTIVE") {
    conditions.push(eq(customer.isActive, false));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(customer)
    .where(where);

  const data = await db
    .select({
      customerId: customer.customerId,
      clerkId: customer.clerkId,
      fullName: customer.fullName,
      isActive: customer.isActive,
    })
    .from(customer)
    .where(where)
    .offset((page - 1) * limit)
    .limit(limit)
    .orderBy(customer.fullName);

  return NextResponse.json({
    data,
    total: Number(totalResult.count),
    page,
    limit,
  });
}
