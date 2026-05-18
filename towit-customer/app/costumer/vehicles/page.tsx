import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import VehiclesClient from "./VehiclesClient";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customer, vehicle } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function VehiclesPage() {
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

  // Mapeamos los datos de base de datos a el formato que espera tu VehiclesClient
  const formattedVehicles = vehiclesData.map(v => ({
    id: v.vehicleId.toString(),
    brand: v.brand,
    model: v.model,
    year: v.year,
    weight: v.weight ? parseFloat(v.weight) : 0,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full pt-6">
        <Link href="/costumer/home" className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition-colors duration-200 shadow-sm border border-gray-200">
          <span className="mr-2 leading-none">←</span> Volver atrás
        </Link>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 pb-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <VehiclesClient initialVehicles={formattedVehicles} />
        </div>
      </main>
    </div>
  );
}
