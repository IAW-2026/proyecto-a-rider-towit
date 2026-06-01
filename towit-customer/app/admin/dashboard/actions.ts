"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customer } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getAdminRecord() {
  const user = await currentUser();
  if (!user) return null;

  const role = user.publicMetadata?.role as string | undefined;
  if (role !== "admin") return { error: "No eres administrador." };
  return user;
}

export async function toggleCustomerActive(customerId: number, isActive: boolean) {
  const user = await currentUser();
  if (!user) return { error: "No autenticado." };

  const role = user.publicMetadata?.role as string | undefined;
  if (role !== "admin") return { error: "No eres administrador." };

  await db.update(customer).set({ isActive }).where(eq(customer.customerId, customerId));

  revalidatePath("/admin/dashboard/customers");
  return { success: true };
}
