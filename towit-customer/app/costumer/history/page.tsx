import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/ui/Footer";
import Pagination from "@/components/ui/Pagination";
import HistoryClient from "./HistoryClient";
import { getTripsAction } from "./actions";

type RawTrip = NonNullable<Awaited<ReturnType<typeof getTripsAction>>['trips']>[number];

function formatTrip(t: RawTrip) {
  return {
    id: t.tripId.toString(),
    date: t.date,
    time: t.time,
    status: t.status,
    vehicleBrand: t.vehicleBrand || "Vehículo desconocido",
    vehicleModel: t.vehicleModel || "",
    originChar: t.originChar ?? undefined,
    DestinationChar: t.DestinationChar ?? undefined,
    originLat: Number(t.originLat),
    originLng: Number(t.originLng),
    destinationLat: Number(t.destinationLat),
    destinationLng: Number(t.destinationLng),
    towerInfo: t.towerInfo || null,
    tripRating: t.tripRating ?? null,
    price: t.status !== "cancelado" && t.status !== "pendiente pago" ? 12000 + (t.tripId * 137) % 15000 : null,
  }
}

export default async function HistoryPage(props: { searchParams?: Promise<{ page?: string }> }) {
  const sp = await props.searchParams;
  const currentPage = Math.max(1, Number(sp?.page) || 1);

  const result = await getTripsAction(currentPage);
  const trips = result.trips || [];

  const formattedTrips = trips.map(formatTrip);

  return (
    <>
    <main>
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6">
        <BackButton />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <HistoryClient trips={formattedTrips} />

        {"totalPages" in result && typeof result.totalPages === "number" && (
          <div className="max-w-2xl mx-auto mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={result.totalPages}
              totalItems={result.totalItems ?? 0}
              basePath="/costumer/history"
            />
          </div>
        )}
      </div>
    </main>
      <Footer />
    </>
  );
}
