import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/api-auth";
import { db } from "@/db";
import { customer } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticate(request);
  if (authError) return authError.error;

  const { id } = await params;
  const customerId = Number(id);

  if (isNaN(customerId)) {
    return NextResponse.json({ error: "ID de cliente inválido." }, { status: 400 });
  }

  const body = await request.json();
  const { isActive } = body;

  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive debe ser un booleano." }, { status: 400 });
  }

  const [existing] = await db
    .select({ customerId: customer.customerId })
    .from(customer)
    .where(eq(customer.customerId, customerId))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  await db
    .update(customer)
    .set({ isActive })
    .where(eq(customer.customerId, customerId));

  return NextResponse.json({ success: true, customerId, isActive });
}
