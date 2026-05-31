"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customer, admin } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function toggleCustomerActive(customerId: number, isActive: boolean) {
  const user = await currentUser();
  if (!user) return { error: "Acceso denegado." };

  const [adminRecord] = await db.select().from(admin).where(eq(admin.clerkId, user.id));
  if (!adminRecord) return { error: "No eres administrador." };

  await db.update(customer).set({ isActive }).where(eq(customer.customerId, customerId));

  revalidatePath("/admin/dashboard/customers");
  return { success: true };
}
