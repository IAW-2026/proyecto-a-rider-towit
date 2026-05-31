import Navbar from "@/components/layout/Navbar";
import RequestRideForm from "@/app/costumer/request-ride/RequestRideForm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customer, vehicle } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function RequestRidePage() {
  const user = await currentUser();
  let vehiclesData: any[] = [];

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

  // Mapeamos los vehículos para enviarlos de forma limpia al componente
  const userVehicles = vehiclesData.map(v => ({
    id: v.vehicleId.toString(),
    brand: v.brand,
    model: v.model,
    year: v.year,
    weight: v.weight ? parseFloat(v.weight) : 0,
  }));

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      <Navbar />
      
      {/* Contenido Principal a pantalla completa (sin márgenes laterales) */}
      <main className="flex-1 relative w-full overflow-hidden">
        <RequestRideForm initialVehicles={userVehicles} />
      </main>
    </div>
  )
}
