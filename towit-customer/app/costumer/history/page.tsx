import Navbar from "@/components/layout/Navbar";
import BackButton from "@/components/ui/BackButton";
import Footer from "@/components/ui/Footer";
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
    towerInfo: t.towerInfo || null,
    tripRating: t.tripRating ?? null,
    price: t.status !== "cancelado" && t.status !== "pendiente pago" ? 12000 + (t.tripId * 137) % 15000 : null,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Navbar />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-6">
          <BackButton />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
          <HistoryClient trips={formattedTrips} />
        </div>
      </main>
      <Footer />
    </div>
  );
}