import RequestRideForm from "@/app/customer/request-ride/RequestRideForm";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { customer, vehicle } from "@/db/schema";
import { eq } from "drizzle-orm";

interface SearchParams {
  payment_status?: string;
  trip_id?: string;
  transaction_id?: string;
}

export default async function RequestRidePage(props: { searchParams: Promise<SearchParams> }) {
  const searchParams = await props.searchParams;
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

  const userVehicles = vehiclesData.map(v => ({
    id: v.vehicleId.toString(),
    brand: v.brand,
    model: v.model,
    year: v.year,
    weight: v.weight ? parseFloat(v.weight) : 0,
  }));

  const paymentResult = searchParams.trip_id && searchParams.payment_status
    ? {
        status: searchParams.payment_status as "success" | "failure",
        tripId: Number(searchParams.trip_id),
        transactionId: searchParams.transaction_id,
      }
    : undefined;

  return (
    <div className="flex flex-col flex-1 bg-background text-foreground overflow-hidden">
      <main className="flex-1 relative w-full overflow-hidden">
        <RequestRideForm
          initialVehicles={userVehicles}
          paymentResult={paymentResult}
        />
      </main>
    </div>
  )
}
