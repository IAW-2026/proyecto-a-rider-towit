import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { db } from "@/db";
import { trip } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticate(request);
  if (authError) return authError.error;

  const { id } = await params;
  const tripId = Number(id);

  if (isNaN(tripId)) {
    return NextResponse.json({ error: "ID de viaje inválido." }, { status: 400 });
  }

  let isDeleted: boolean;

  try {
    const body = await request.json();
    const raw = body.isDeleted;

    if (typeof raw === "boolean") {
      isDeleted = raw;
    } else if (typeof raw === "string") {
      isDeleted = raw === "true" || raw === "1";
    } else if (typeof raw === "number") {
      isDeleted = raw === 1;
    } else {
      return NextResponse.json({ error: "isDeleted debe ser un booleano." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido. Se esperaba JSON con { isDeleted: boolean }." }, { status: 400 });
  }

  const [existing] = await db
    .select({ tripId: trip.tripId })
    .from(trip)
    .where(eq(trip.tripId, tripId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Viaje no encontrado." }, { status: 404 });
  }

  await db
    .update(trip)
    .set({ isDeleted })
    .where(eq(trip.tripId, tripId));

  return NextResponse.json({ success: true, tripId, isDeleted });
}
