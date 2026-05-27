import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import HistoryClient from "./HistoryClient";
import { getTripsAction } from "./actions";

export default async function HistoryPage() {
  const result = await getTripsAction();
  const trips = result.trips || [];

  const formattedTrips = trips.map((t: any) => ({
    id: t.tripId.toString(),
    date: t.date,
    time: t.time,
    status: t.status,
    vehicleBrand: t.vehicleBrand || "Vehículo desconocido",
    vehicleModel: t.vehicleModel || "",
    originChar: t.originChar,
    DestinationChar: t.DestinationChar,
    originLat: Number(t.originLat),
    originLng: Number(t.originLng),
    destinationLat: Number(t.destinationLat),
    destinationLng: Number(t.destinationLng),
  }));

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full pt-6">
        <Link href="/costumer/home" className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-lg transition-colors duration-200 shadow-sm border border-gray-200">
          <span className="mr-2 leading-none">←</span> Volver atrás
        </Link>
      </div>

      <main className="flex-1 pb-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <HistoryClient trips={formattedTrips} />
        </div>
      </main>
    </div>
  );
}