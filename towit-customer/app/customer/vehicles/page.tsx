import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/ui/Footer";
import VehiclesClient from "./VehiclesClient";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customer, vehicle } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function VehiclesPage() {
  const user = await currentUser();
  let vehiclesData: { vehicleId: number; brand: string; model: string; year: number; weight: string | null }[] = [];

  if (user) {
    const currentCustomer = await db.query.customer.findFirst({
      where: eq(customer.clerkId, user.id)
    });

    if (currentCustomer) {
      vehiclesData = await db.query.vehicle.findMany({
        where: eq(vehicle.customerId, currentCustomer.customerId)
      });
    }
  }

  const formattedVehicles = vehiclesData.map(v => ({
    id: v.vehicleId.toString(),
    brand: v.brand,
    model: v.model,
    year: v.year,
    weight: v.weight ? parseFloat(v.weight) : 0,
  }));

  return (
    <>
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-6 md:px-12 w-full pt-6">
          <BackButton />
        </div>

        <main className="flex-1 pb-10">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
            <VehiclesClient initialVehicles={formattedVehicles} />
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
}
