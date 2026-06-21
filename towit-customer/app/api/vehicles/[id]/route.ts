import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vehicle } from "@/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = authenticate(request)
  if (authError) return authError.error

  const { id } = await params;

  const vehicleId = Number(id);
  if (Number.isNaN(vehicleId)) {
    return NextResponse.json({ error: "ID de vehículo inválido" }, { status: 400 });
  }

  const result = await db
    .select({ brand: vehicle.brand, model: vehicle.model })
    .from(vehicle)
    .where(eq(vehicle.vehicleId, vehicleId))
    .limit(1);

  if (result.length === 0) {
    return NextResponse.json({ error: "Vehículo no encontrado" }, { status: 404 });
  }

  const v = result[0];
  return NextResponse.json({
    id: vehicleId,
    name: `${v.brand} ${v.model}`,
    brand: v.brand,
    model: v.model,
  });
}
