import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { trip, customer, vehicle, admin } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";

export default async function AdminDashboard() {
  const user = await currentUser();
  
  if (!user) {
    redirect("/admin");
  }

  // Verificar que el usuario exista en la tabla Admin de Neon
  const [adminRecord] = await db.select().from(admin).where(eq(admin.clerkId, user.id));
  
  if (!adminRecord) {
    // Si no está registrado como admin, redirigir a inicio o vista de cliente
    redirect("/admin");
  }

  const [tripCount] = await db.select({ value: count() }).from(trip);
  const [customerCount] = await db.select({ value: count() }).from(customer);
  const [vehicleCount] = await db.select({ value: count() }).from(vehicle);

  const recentTrips = await db
    .select({
      tripId: trip.tripId,
      date: trip.date,
      time: trip.time,
      origin: trip.originChar,
      destination: trip.DestinationChar,
      status: trip.status,
      customerName: customer.fullName,
    })
    .from(trip)
    .leftJoin(customer, eq(trip.customerId, customer.customerId))
    .orderBy(desc(trip.tripId))
    .limit(20);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar variant="admin" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Link href="/admin/dashboard/trips" className="bg-card rounded-xl shadow p-6 border-l-4 border-brand-dark hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block group">
            <h2 className="text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide group-hover:text-foreground transition">Viajes Totales</h2>
            <p className="text-4xl font-bold text-foreground">{tripCount.value}</p>
          </Link>
          <Link href="/admin/dashboard/customers" className="bg-card rounded-xl shadow p-6 border-l-4 border-brand-yellow-dark hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block group">
            <h2 className="text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide group-hover:text-foreground transition">Clientes Registrados</h2>
            <p className="text-4xl font-bold text-foreground">{customerCount.value}</p>
          </Link>
          <Link href="/admin/dashboard/vehicles" className="bg-card rounded-xl shadow p-6 border-l-4 border-brand-yellow hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 block group">
            <h2 className="text-muted-foreground text-sm font-semibold mb-1 uppercase tracking-wide group-hover:text-foreground transition">Vehículos Registrados</h2>
            <p className="text-4xl font-bold text-foreground">{vehicleCount.value}</p>
          </Link>
        </div>

        <div className="bg-card rounded-xl shadow-xl overflow-hidden border border-border">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Últimos Viajes Registrados</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Fecha y Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Origen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Destino</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {recentTrips.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-center text-sm text-muted-foreground">
                      No hay viajes registrados aún.
                    </td>
                  </tr>
                ) : (
                  recentTrips.map((info) => (
                    <tr key={info.tripId} className="hover:bg-muted">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">#{info.tripId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {info.date} {info.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {info.customerName || "Desconocido"}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={info.origin || "Sin origen guardado"}>
                        {info.origin || "Coordenadas"}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate" title={info.destination || "Sin destino guardado"}>
                        {info.destination || "Coordenadas"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          info.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          info.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {info.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}