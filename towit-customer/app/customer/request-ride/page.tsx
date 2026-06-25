import RequestRideForm from "@/app/customer/request-ride/RequestRideForm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customer, vehicle, trip } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface SearchParams {
  trip_id?: string;
}

export type InitialTripData = {
  tripId: number;
  status: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  estimatedPrice: number | null;
  towerId: string | null;
} | null;

export default async function RequestRidePage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
  const user = await currentUser();
  let vehiclesData: { vehicleId: number; brand: string; model: string; year: number; weight: string | null }[] = [];

  let initialTrip: InitialTripData = null;

  if (user) {
    const currentCustomer = await db.query.customer.findFirst({
      where: eq(customer.clerkId, user.id)
    });

    if (currentCustomer) {
      vehiclesData = await db.query.vehicle.findMany({
        where: eq(vehicle.customerId, currentCustomer.customerId)
      });

      if (searchParams.trip_id) {
        const tripRecord = await db.query.trip.findFirst({
          where: and(
            eq(trip.tripId, Number(searchParams.trip_id)),
            eq(trip.customerId, currentCustomer.customerId),
          ),
        });
        if (tripRecord) {
          initialTrip = {
            tripId: tripRecord.tripId,
            status: tripRecord.status,
            originLat: parseFloat(tripRecord.originLat),
            originLng: parseFloat(tripRecord.originLng),
            destinationLat: parseFloat(tripRecord.destinationLat),
            destinationLng: parseFloat(tripRecord.destinationLng),
            estimatedPrice: tripRecord.estimatedPrice ? parseFloat(tripRecord.estimatedPrice) : null,
            towerId: tripRecord.towerId,
          };
        }
      }
    }
  }

  const userVehicles = vehiclesData.map(v => ({
    id: v.vehicleId.toString(),
    brand: v.brand,
    model: v.model,
    year: v.year,
    weight: v.weight ? parseFloat(v.weight) : 0,
  }));

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground overflow-hidden">
      <main className="flex-1 relative w-full overflow-hidden">
        <RequestRideForm
          initialVehicles={userVehicles}
          initialTrip={initialTrip}
          tripIdFromUrl={searchParams.trip_id ? Number(searchParams.trip_id) : undefined}
        />
      </main>
    </div>
  )
}
